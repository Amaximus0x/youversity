interface Window {
  grecaptcha: {
    ready: (callback: () => void) => void;
    render: (
      element: HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback': () => void;
      }
    ) => void;
    reset: () => void;
  };
  onRecaptchaSuccess: (token: string) => void;
  onRecaptchaExpired: () => void;
} 