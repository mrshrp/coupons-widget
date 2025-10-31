import CouponsWidget from './coupons-widget';

// Глобальная функция для создания виджета
if (typeof window !== 'undefined') {
  (window as any).CouponsWidget = CouponsWidget;

  // Счетчик для генерации уникальных ID
  let widgetCounter = 0;

  // Автоматическая инициализация при загрузке DOM
  function autoInit() {
    const containers = document.querySelectorAll('[data-coupons-widget]');

    containers.forEach(container => {
      const htmlContainer = container as HTMLElement;
      const options = {
        containerId: htmlContainer.id || `coupons-widget-${++widgetCounter}`,
        isin: htmlContainer.dataset.isin || null
      };

      if (!htmlContainer.id) {
        htmlContainer.id = options.containerId;
      }

      new CouponsWidget(options);
    });
  }

  // Запуск автоинициализации
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

export default CouponsWidget;