export class HuffmanNode {
  public frecuencia: number;
  public caracter?: string;
  public left?: HuffmanNode;
  public right?: HuffmanNode;

  constructor(frecuencia: number, caracter?: string, left?: HuffmanNode, right?: HuffmanNode) {
    this.frecuencia = frecuencia;
    this.caracter = caracter;
    this.left = left;
    this.right = right;
  }

  public isLeaf(): boolean {
    return !this.left && !this.right;
  }
}
