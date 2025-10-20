declare module '*.svg';
declare module '*.png';
declare module '*.css';
declare module '*.md' {
  const content: string;
  export default content;
};
