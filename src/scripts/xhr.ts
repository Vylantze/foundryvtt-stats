import axios, { Axios, AxiosResponse } from 'axios';

export default class XHR {
  private instance: Axios;

  constructor () {
    this.instance = axios.create();
  }

  public async get<T> (url: string): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await this.instance.get(url);
      return response.data;
    } catch (e: unknown) {
      console.error(`[XHR][get] Failed from ${url}`, e);
      return null;
    }
  }

  public async post<T> (url: string, data: unknown): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await this.instance.post(url, data);
      return response.data;
    } catch (e: unknown) {
      console.error(`[XHR][post] Failed to post to ${url}`, e);
      return null;
    }
  }

  public async delete (url: string): Promise<boolean> {
    try {
      const response: AxiosResponse = await this.instance.delete(url);
      return response.status % 100 === 2;
    } catch (e: unknown) {
      console.error(`[XHR][delete] Failed to delete ${url}`, e);
      return false;
    }
  }

  public async patch<T> (url: string, data: unknown): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await this.instance.patch(url, data);
      return response.data;
    } catch (e: unknown) {
      console.error(`[XHR][patch] Failed to patch ${url}`, e);
      return null;
    }
  }
}