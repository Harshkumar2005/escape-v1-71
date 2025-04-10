
declare module 'file-icons-js' {
  const fileIcons: {
    getClassWithColor: (filename: string) => string;
    getClass: (filename: string) => string;
    getColor: (filename: string) => string;
  };
  export = fileIcons;
}
