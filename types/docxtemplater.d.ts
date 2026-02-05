declare module "docxtemplater" {
  import PizZip from "pizzip";

  interface DocxtemplaterOptions {
    paragraphLoop?: boolean;
    linebreaks?: boolean;
    nullGetter?: (part: any, scopeManager: any) => string;
    parser?: (tag: string) => any;
    delimiters?: {
      start: string;
      end: string;
    };
  }

  class Docxtemplater {
    constructor(zip: PizZip, options?: DocxtemplaterOptions);
    render(data: Record<string, any>): void;
    getZip(): PizZip;
    setData(data: Record<string, any>): void;
    compile(): void;
  }

  export = Docxtemplater;
}

declare module "pizzip" {
  class PizZip {
    constructor(data?: Buffer | string | ArrayBuffer);
    file(name: string): {
      asText(): string;
      asUint8Array(): Uint8Array;
      asNodeBuffer(): Buffer;
    } | null;
    generate(options: {
      type: "nodebuffer" | "blob" | "uint8array" | "arraybuffer" | "base64";
      compression?: "STORE" | "DEFLATE";
    }): any;
  }

  export = PizZip;
}
