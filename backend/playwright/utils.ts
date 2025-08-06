// Helper function to add random delay
export const randomDelay = (min: number, max: number) => 
  new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

export const delay = (s: number) => new Promise(resolve => setTimeout(resolve, s * 1000));
