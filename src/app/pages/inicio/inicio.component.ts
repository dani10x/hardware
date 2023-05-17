import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HuffmanNode } from 'src/app/models/huffmanNode.model';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {

  archivoForm: FormGroup;
  mapa: Map<string, string>;

  constructor(private fb: FormBuilder) {
    this.archivoForm = this.fb.group({
      archivoTxt: [''],
      archivoBin: [''],
    });
    this.mapa = new Map<string, string>;
  }

  public comprimir(): void {
    const fileInput = document.getElementById('archivoTxt') as HTMLInputElement;
    this.stringDocumento(fileInput).then((val) => {
      const [compressedData, codeMap] = this.compressUsingHuffman(val);
      this.mapa = codeMap;
      console.log(compressedData);
      const uint8Array = new Uint8Array(compressedData.length / 8);
      for (let i = 0; i < compressedData.length; i += 8) {
        const byte = compressedData.substr(i, 8);
        uint8Array[i / 8] = parseInt(byte, 2);
      }
      this.downloadBinaryFile(uint8Array, 'comprimido.bin');
    });
  }

  public async descomprimir(): Promise<void> {
    const fileInput = document.getElementById('archivoBin') as HTMLInputElement;
    const compressedData = await this.readBinaryFile(fileInput);
    const compressedString = Array.from(compressedData, (byte) => byte.toString(2).padStart(8, '0')).join('');
    const texto: String = this.decompressUsingHuffman(compressedString);
    const uint8Array = new Uint8Array(texto.length);
    for (let i = 0; i < texto.length; i++) {
      uint8Array[i] = texto.charCodeAt(i);
    }

    this.downloadBinaryFile(uint8Array, 'decompressed.txt');

  }

  private stringDocumento(fileInput: HTMLInputElement): Promise<string> {
    return new Promise((resolve, reject) => {
      const file = fileInput.files?.[0];

      if (!file) {
        reject(new Error('No se seleccionó ningún archivo.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          resolve(content);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (event) => {
        reject(new Error('Error al leer el archivo.'));
      };

      reader.readAsText(file);
    });
  }

  private buildFrequencyMap(content: string): Map<string, number> {
    const charMap = new Map<string, number>();

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const count = charMap.get(char) || 0;
      charMap.set(char, count + 1);
    }

    return charMap;
  }

  private buildHuffmanTree(frequencyMap: Map<string, number>): HuffmanNode | null {
    const priorityQueue: HuffmanNode[] = [];

    frequencyMap.forEach((frequency, char) => {
      priorityQueue.push(new HuffmanNode(frequency, char));
    });

    while (priorityQueue.length > 1) {
      priorityQueue.sort((a, b) => a.frecuencia - b.frecuencia);
      const left = priorityQueue.shift();
      const right = priorityQueue.shift();
      const newNode = new HuffmanNode(left!.frecuencia + right!.frecuencia, undefined, left, right);
      priorityQueue.push(newNode);
    }

    return priorityQueue[0] || null;
  }

  private buildCodeMap(huffmanTree: HuffmanNode, prefix: string, codeMap: Map<string, string>) {
    if (huffmanTree.isLeaf()) {
      codeMap.set(huffmanTree.caracter!, prefix);
    } else {
      this.buildCodeMap(huffmanTree.left!, prefix + '0', codeMap);
      this.buildCodeMap(huffmanTree.right!, prefix + '1', codeMap);
    }
  }

  private compressUsingHuffman(content: string): [string, Map<string, string>] {
    const frequencyMap = this.buildFrequencyMap(content);
    const huffmanTree = this.buildHuffmanTree(frequencyMap);
    const codeMap = new Map<string, string>();

    if (!huffmanTree) {
      throw new Error('El archivo está vacío.');
    }

    this.buildCodeMap(huffmanTree, '', codeMap);

    let compressedData = '';
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const code = codeMap.get(char);
      if (code) {
        compressedData += code;
      }
    }

    return [compressedData, codeMap];
  }

  private downloadBinaryFile(data: Uint8Array, filename: string) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  private decompressUsingHuffman(compressedData: string): string {
    console.log(this.mapa);
    console.log(compressedData);
    let decompressedData = '';
    let currentCode = '';

    for (let i = 0; i < compressedData.length; i++) {
      currentCode += compressedData[i];
      const char = Array.from(this.mapa.entries()).find(([, code]) => code === currentCode);

      if (char) {
        decompressedData += char[0];
        currentCode = '';
      }
    }

    return decompressedData;
  }

  private readBinaryFile(fileInput: HTMLInputElement): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const file = fileInput.files?.[0];

      if (!file) {
        reject(new Error('No se seleccionó ningún archivo.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(uint8Array);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (event) => {
        reject(new Error('Error al leer el archivo.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

}
