type TSubscribe = (subscribeCallback: (value: any) => void) => void;
type TUnsubscribe = () => void;

interface ISource {
  subscribe: TSubscribe;
}

interface IExtendedSource extends ISource {
  catch: (error: any) => { subscribe: TSubscribe };
}

type IOperatorArgs = Partial<{
  value: any;
  next: (value: any) => void;
  error: (errorValue: any) => void;
}>;

type IOperator = (args: IOperatorArgs) => TUnsubscribe;

export function pipe(
  source: ISource,
  ...operators: IOperator[]
): IExtendedSource;

export function map(callback: (value: any) => any): IOperator;
export function filter(callback: (value: any) => any): IOperator;
export function promise(callback: (value: any) => Promise<any>): IOperator;
export function effect(callback: (value: any) => any): IOperator;
export function stream(callback: (value: any) => ISource): IOperator;
export function timeout(ms: number, onTick?: (value: any) => any): IOperator;
export function interval(ms: number, onTick?: (value: any) => any): IOperator;
