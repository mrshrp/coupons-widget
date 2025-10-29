(function () {
  'use strict';

  // Проверяем, что виджет еще не загружен
  if (window.CouponsWidget) {
    return;
  }

  /**
   * Встраиваемый виджет купонов
   */
  class CouponsWidget {
    constructor(options = {}) {
      this.options = {
        containerId: options.containerId || 'coupons-widget',
        isin: options.isin || null,
        emptyMessage: "Данных нет",
        loadingMessage: "...Загрузка данных",
        ...options
      };

      this.container = null;
      this.data = options.data || this.getDefaultData();

      this.init();
    }

    /**
     * Инициализация виджета
     */
    init() {
      this.createContainer();
      this.render();

      if (this.options.isin) {
        this.loadData();
      }
    }

    /**
     * Создание контейнера
     */
    createContainer() {
      let container = document.getElementById(this.options.containerId);

      if (!container) {
        container = document.createElement('div');
        container.id = this.options.containerId;
        document.body.appendChild(container);
      }

      this.container = container;

      // Добавляем базовый класс, если его еще нет
      if (!this.container.classList.contains('coupons-widget')) {
        this.container.classList.add('coupons-widget');
      }
    }



    /**
     * Рендеринг виджета
     */
    render() {
      let html = `<div class="coupons-list">`;
      if (this.data.length === 0) {
        html += `<div class="empty">${this.options.emptyMessage}</div>`
      } else {
        this.data.forEach(item => {
          html += `
          <div class="list-item">
            <div>
              <span>Дата выплаты: ${item.paymentDate}</span>
              <span>${item.description || ''}</span>
            </div>
            <div>
              <span>Ставка: ${item.rate}</span>
              <span>Сумма 1 облигации: ${item.amount}</span>
            </div>
          </div>
        `;
        });
      }


      html += '</div>';

      this.container.innerHTML = html;
    }

    /**
     * Загрузка данных с API
     */
    async loadData() {
      try {
        this.showLoading();
        await this.loadFromMOEX(this.options.isin);
      } catch (error) {
        this.showError(error.message);
      }
    }

    /**
     * Проверка, является ли строка ISIN кодом
     */
    isISIN(str) {
      // ISIN код имеет формат: 2 буквы + 10 цифр или букв
      return /^[A-Z]{2}[A-Z0-9]{10}$/i.test(str);
    }

    /**
     * Загрузка данных с MOEX API по ISIN
     */
    async loadFromMOEX(isin) {
      console.log('load', isin);
      const response = await fetch(`https://iss.moex.com/iss/securities/${isin}/bondization.json?iss.json=extended&iss.meta=off&iss.only=coupons&lang=ru&limit=unlimited`);

      if (!response.ok) {
        throw new Error('Ошибка загрузки данных с MOEX');
      }

      const data = await response.json();
      const coupons = data[1]?.coupons ?? [];

      // Преобразуем данные MOEX в формат виджета
      this.data = this.convertMOEXData(coupons);
      console.log('converted data', this.data);
      this.render();
    }

    /**
     * Преобразование данных MOEX в формат виджета
     */
    convertMOEXData(couponsData) {
      if (couponsData.length === 0 || !couponsData) {
        return [];
      }
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня для точного сравнения

      // Сортируем купоны по дате
      const sortedCoupons = [...couponsData].sort((a, b) =>
        new Date(a.coupondate) - new Date(b.coupondate)
      );

      // Находим индекс первого предстоящего купона
      let firstUpcomingIndex = sortedCoupons.findIndex(coupon =>
        new Date(coupon.coupondate) >= currentDate
      );

      // Если все купоны в прошлом, берем последние 5
      if (firstUpcomingIndex === -1) {
        firstUpcomingIndex = sortedCoupons.length;
      }

      // Определяем диапазон: 2 прошедших + текущий + 2 будущих = 5 купонов
      const startIndex = Math.max(0, firstUpcomingIndex - 2);
      const endIndex = Math.min(sortedCoupons.length, firstUpcomingIndex + 3);

      // Получаем ближайшие 5 купонов
      const selectedCoupons = sortedCoupons.slice(startIndex, endIndex);

      // Определяем текущий купон (первый предстоящий)
      const currentCouponDate = firstUpcomingIndex < sortedCoupons.length
        ? sortedCoupons[firstUpcomingIndex].coupondate
        : null;

      return selectedCoupons.map(coupon => {
        const status = this.getCouponStatus(coupon.coupondate, currentDate, currentCouponDate);

        return {
          paymentDate: this.formatDate(coupon.coupondate),
          rate: `${coupon.valueprc}%`,
          amount: `${coupon.value_rub}₽`,
          current: status === 'current',
          disabled: status === 'disabled',
        };
      });
    }

    /**
     * Определение статуса купона
     */
    getCouponStatus(couponDate, currentDate, currentCouponDate) {
      const couponDateTime = new Date(couponDate).getTime();
      const currentDateTime = currentDate.getTime();

      if (couponDate === currentCouponDate) {
        return 'current';
      }

      if (couponDateTime < currentDateTime) {
        return 'disabled';
      } else if (couponDateTime === currentDateTime) {
        return 'upcoming';
      } else {
        return '';
      }
    }

    /**
     * Форматирование даты
     */
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }

    /**
     * Показать индикатор загрузки
     */
    showLoading() {
      this.container.innerHTML = `<div>${this.options.loadingMessage}</div>`;
    }

    /**
     * Показать ошибку
     */
    showError(message) {
      this.container.innerHTML = `<div>Ошибка: ${message}</div>`;
    }

    /**
     * Загрузить данные по ISIN или URL
     */
    async load(isinOrUrl) {
      this.options.isin = isinOrUrl;
      await this.loadData();
    }

    /**
     * Обновить данные
     */
    updateData(newData) {
      this.data = newData;
      this.render();
    }

    /**
     * Уничтожить виджет
     */
    destroy() {
      if (this.container) {
        this.container.innerHTML = '';
      }
    }

    /**
     * Данные по умолчанию
     */
    getDefaultData() {
      return [
      ];
    }
  }

  // Глобальная функция для создания виджета
  window.CouponsWidget = CouponsWidget;

  // Счетчик для генерации уникальных ID
  let widgetCounter = 0;

  // Автоматическая инициализация при загрузке DOM
  function autoInit() {
    const containers = document.querySelectorAll('[data-coupons-widget]');

    containers.forEach(container => {
      const options = {
        containerId: container.id || `coupons-widget-${++widgetCounter}`,
        isin: container.dataset.isin || null
      };

      if (!container.id) {
        container.id = options.containerId;
      }
      console.log('autoload ', container.id, options.isin);
      new CouponsWidget(options);
    });
  }

  // Запуск автоинициализации
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})();
