import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// 禁止右键菜单
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// 禁止F12开发者工具
document.addEventListener('keydown', (e) => {
  if (e.key === 'F12' || 
      (e.ctrlKey && e.shiftKey && e.key === 'I') || 
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.ctrlKey && e.key === 'u')) {
    e.preventDefault();
  }
});

// 禁止选择文本
// document.addEventListener('selectstart', (e) => {
//   e.preventDefault();
// });

// 禁止拖拽
document.addEventListener('dragstart', (e) => {
  e.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
