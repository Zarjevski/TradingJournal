/// <reference types="react" />

declare namespace React {
  type ComponentType<P = {}> = React.ComponentClass<P> | React.FunctionComponent<P>;
}
