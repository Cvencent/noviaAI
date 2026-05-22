import axios from 'axios'
import { OpenaiProvider } from './openai.provider'

jest.mock('axios')

describe('OpenaiProvider embeddings', () => {
  it('calls the OpenAI-compatible embeddings endpoint', async () => {
    const post = jest.fn().mockResolvedValue({
      data: { data: [{ embedding: [0.1, 0.2, 0.3] }] },
    })
    ;(axios.create as jest.Mock).mockReturnValue({ post })
    const provider = new OpenaiProvider()
    provider.setApiKey('test-key')
    provider.setBaseUrl('https://example.test/v1')

    await expect(provider.embed('memory chip')).resolves.toEqual([0.1, 0.2, 0.3])
    expect(post).toHaveBeenCalledWith('/embeddings', {
      model: 'text-embedding-3-small',
      input: 'memory chip',
    })
  })
})
