import { ButtonEnum, type ButtonProp } from "../types/button";

export const Button = ({
  text,
  onPress,
  icon,
  type = ButtonEnum.MAIN,
  style,
  aria_label = undefined,
  children,
}: ButtonProp) => {
  return type === ButtonEnum.MAIN ? (
    <button
      onClick={onPress}
      className="w-full max-w-md p-6 md:p-8 text-xl md:text-2xl font-semibold text-white bg-gradient-to-br
      from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-4
      dark:from-indigo-700 dark:to-indigo-900 dark:hover:from-indigo-800 dark:hover:to-indigo-950"
    >
      <span className="text-3xl">{icon}</span>
      <span>{text}</span>
    </button>
  ) : type === ButtonEnum.CUSTOM ? (
    <button onClick={onPress} className={style} aria-label={aria_label}>
      {children}
    </button>
  ) : null;
};
