import "jspdf";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: {
      head?: any[][];
      body?: any[][];
      foot?: any[][];
      startY?: number;
      margin?:
        | number
        | { top?: number; right?: number; bottom?: number; left?: number };
      styles?: any;
      headStyles?: any;
      bodyStyles?: any;
      footStyles?: any;
      alternateRowStyles?: any;
      columnStyles?: any;
      theme?: "striped" | "grid" | "plain";
      [key: string]: any;
    }) => jsPDF;
  }
}
