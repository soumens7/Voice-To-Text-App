import axios from 'axios';
import { callAPIWithRetry } from '../route/route';

jest.mock('axios');

describe('callAPIWithRetry', () => {
  it('retries on 429 and eventually succeeds', async () => {
    axios.post
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: { value: 'success' } });

    const result = await callAPIWithRetry('test', 2, 10);

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ value: 'success' });
  });
});
