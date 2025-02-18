import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

serviceWorkerRegistration.registerServiceWorker(); // 푸시 알림 서비스 워커 실행
serviceWorkerRegistration.register(); // 오프라인, 캐싱 서비스 워커 실행

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);