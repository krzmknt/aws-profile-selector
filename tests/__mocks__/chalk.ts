const chalk = {
  bold: (str: string) => str,
  green: (str: string) => str,
  red: (str: string) => str,
  yellow: (str: string) => str,
  blue: (str: string) => str,
  cyan: (str: string) => str,
  magenta: (str: string) => str,
  gray: (str: string) => str,
  white: (str: string) => str,
  black: (str: string) => str,
  bgRed: (str: string) => str,
  bgGreen: (str: string) => str,
  bgBlue: (str: string) => str,
  bgYellow: (str: string) => str,
  dim: (str: string) => str,
  italic: (str: string) => str,
  underline: (str: string) => str,
  inverse: (str: string) => str,
  strikethrough: (str: string) => str,
  visible: (str: string) => str,
  hidden: (str: string) => str,
  reset: (str: string) => str,
}

const createChainable = () => {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (typeof prop === 'string' && prop in chalk) {
        return createChainable()
      }
      return (str: string) => str
    },
    apply(target, thisArg, args) {
      return args[0]
    },
  }
  return new Proxy(() => {}, handler)
}

const chalkProxy = createChainable()

export default chalkProxy