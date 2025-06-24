export interface Mp3Mp4File {
  name: string;
  path?: string;
  handle?: FileSystemFileHandle;
  file?: File;
}

export interface Subtitle {
  start: number;
  end: number;
  text: string;
}
