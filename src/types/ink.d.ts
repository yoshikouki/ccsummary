declare module 'ink' {
  import { ReactElement } from 'react';
  
  export function render(element: ReactElement): void;
  
  export interface BoxProps {
    flexDirection?: 'row' | 'column';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
    borderColor?: string;
    width?: string | number;
    flexGrow?: number;
    children?: React.ReactNode;
  }
  
  export interface TextProps {
    color?: string;
    bold?: boolean;
    italic?: boolean;
    inverse?: boolean;
    children?: React.ReactNode;
  }
  
  export interface AppContext {
    exit(): void;
  }
  
  export const Box: React.FC<BoxProps>;
  export const Text: React.FC<TextProps>;
  export const Newline: React.FC;
  export function useInput(handler: (input: string, key: any) => void): void;
  export function useApp(): AppContext;
}

declare module 'ink-select-input' {
  interface Item {
    label: string;
    value: string;
  }
  
  interface SelectInputProps {
    items: Item[];
    onSelect: (item: Item) => void;
  }
  
  const SelectInput: React.FC<SelectInputProps>;
  export default SelectInput;
}

declare module 'ink-text-input' {
  interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }
  
  const TextInput: React.FC<TextInputProps>;
  export default TextInput;
}