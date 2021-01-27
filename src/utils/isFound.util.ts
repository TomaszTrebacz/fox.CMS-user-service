import { UserI } from '../models';

// util throw error if query does not return any row(s)
export const isFound = (res: UserI[]): void => {
  if (res.length == 0) {
    throw new Error(`Can not find any data.`);
  }
};