import { ElevenLabsClient } from 'elevenlabs';

let _client: ElevenLabsClient | null = null;
function getClient() {
  if (!_client) _client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });
  return _client;
}

export async function synthesizeNarration(
  text: string,
  voiceId: string,
): Promise<Buffer> {
  const client = getClient();
  const audio = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_turbo_v2_5',
    output_format: 'mp3_44100_128',
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  });
  const chunks: Buffer[] = [];
  for await (const chunk of audio as unknown as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
