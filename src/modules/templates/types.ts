export interface TemplateMeta {
  id: string;
  name: string;
  category: 'ecommerce' | 'store-review';
  thumbnail: string;
  author: string;
  updatedAt: string;
}

export interface TemplateSchema {
  version: number;
  meta: TemplateMeta;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  theme: Record<string, string>;
  elements: unknown[];
}
