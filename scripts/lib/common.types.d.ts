export type OS = 'linux' | 'macos' | 'win';

export interface Manifest {
  version: '1';
  previews: Record<string, Preview>;
}

export interface Preview {
  builds: Record<string, PreviewBuild>;
  updatedAt: string;
  commitId: string;
  author: string;
}

export interface PreviewBuild {
  url: string;
  checksum: string;
}

type StyleText = typeof import('node:util').styleText;
export type StyleTextFormat = Parameters<StyleText>[0] | 'none';

export interface Profile {
  name: string;
  email: string;
  id: string;
  token: string;
  secret: string;
  expirationDate?: string;
  current?: boolean;
}
