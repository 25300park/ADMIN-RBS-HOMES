import { Loader } from '@googlemaps/js-api-loader';

let loader: Loader;

export const loadGoogleMapsAPI = () => {
  if (!loader) {
    loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_KEY as string,
      language: 'en',
      version: 'weekly',
      libraries: ['places'],
    });
  }
  return loader.load();
};
