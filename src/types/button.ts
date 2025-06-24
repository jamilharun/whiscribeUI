import type { ReactNode } from "react";

export enum ButtonEnum {
  MAIN = "main",
  CUSTOM = "custom",
}

export type ButtonProp = {
  text?: string;
  onPress?: () => void;
  icon?: ReactNode;
  type?: ButtonEnum;
  style?: string;
  aria_label?: string | undefined;
  children?: ReactNode;
};
