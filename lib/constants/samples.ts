export interface SampleBenchmark {
  id: string;
  name: string;
  tag: 'Contradicted' | 'Supported' | 'Unverified';
  tagVariant: 'contradicted' | 'supported' | 'unverified';
  description: string;
  title: string;
  contentType: string;
  channel: string;
  draft: string;
}

export const BENCHMARK_SAMPLES: SampleBenchmark[] = [
  {
    id: 'sample-contradicted',
    name: 'Bold launch post',
    tag: 'Contradicted',
    tagVariant: 'contradicted',
    description: 'Wrong specs and a few superlatives.',
    title: 'NexTech Nova — Promotional Launch Announcement',
    contentType: 'Advertisement',
    channel: 'Instagram',
    draft: "Meet the NexTech Nova! Enjoy an incredible 48 hours of battery life, weighing just 185 grams. This completely waterproof device features an AI robot buddy and is the world's best smartphone for everyone. Get yours today!",
  },
  {
    id: 'sample-supported',
    name: 'Clean product page',
    tag: 'Supported',
    tagVariant: 'supported',
    description: 'Everything matches approved facts.',
    title: 'NexTech Nova — Official Product Overview',
    contentType: 'Product description',
    channel: 'Website',
    draft: 'Introducing the NexTech Nova. The device offers up to 12 hours of battery life under specified test conditions and weighs 185 grams. Crafted from recycled aluminium, it features a built-in smart assistant for hands-free convenience. Scheduled for launch on 15 December 2026.',
  },
  {
    id: 'sample-unverified',
    name: 'Plausible claims',
    tag: 'Unverified',
    tagVariant: 'unverified',
    description: 'Sounds right, but no approved source.',
    title: 'NexTech Nova — Future Tech Preview',
    contentType: 'Press release',
    channel: 'Website',
    draft: 'NexTech Nova introduces an experimental quantum-enhanced display matrix and ultra-conductive cooling architecture. Experience next-generation mobile processing built for heavy computational workloads.',
  },
];
