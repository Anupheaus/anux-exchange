export interface IFileUpload {
  name: string;
  extension: string;
  data: Buffer;
  encoding: string;
  mimetype: string;
}

export namespace IFileUpload {

  export function splitName(filename: string) {
    const parts = filename.split('.');
    return { extension: parts.pop(), name: parts.join('.') };
  }

}
