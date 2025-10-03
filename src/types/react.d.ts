
/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="react/jsx-runtime" />

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

declare module 'react/jsx-dev-runtime' {
  export * from 'react/jsx-dev-runtime';
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
  }
}

export {};
