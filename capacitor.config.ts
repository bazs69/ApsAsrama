import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dormisync.asrama',
  appName: 'DormiSync',
  webDir: 'public',
  server: {
    // Dengan ajaib, kini Emulator Android HP Anda akan merasa bahwa server Next.js ada di dalam HP-nya
    url: 'http://localhost:3000',
    cleartext: true
  }
};

export default config;
