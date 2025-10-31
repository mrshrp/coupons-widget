import ElementBuilder, { EnhancedElement } from './element-builder';

/**
 * Интерфейс для опций виджета купонов
 */
export interface CouponsWidgetOptions {
  containerId?: string;
  isin?: string | null;
  emptyMessage?: string;
  loadingMessage?: string;
  data?: CouponData[];
}

/**
 * Интерфейс для данных купона
 */
export interface CouponData {
  paymentDate: string;
  rate: string;
  amount: string;
  current?: boolean;
  disabled?: boolean;
  description?: string;
}

/**
 * Встраиваемый TypeScript виджет купонов для облигаций
 */
export default class CouponsWidget {
  private options: Required<CouponsWidgetOptions>;
  private container: EnhancedElement<'div'> | null = null;
  private data: CouponData[];

  constructor(options: CouponsWidgetOptions = {}) {
    this.options = {
      containerId: options.containerId || 'coupons-widget',
      isin: options.isin || null,
      emptyMessage: options.emptyMessage || "Данных нет",
      loadingMessage: options.loadingMessage || "Загрузка данных",
      data: options.data || []
    };

    this.data = this.options.data || this.getDefaultData();
    this.init();
  }

  /**
   * Инициализация виджета
   */
  private init(): void {
    this.iniBaseContainer();
    this.render();

    if (this.options.isin) {
      this.loadData();
    }
  }

  /**
   * Создание контейнера
   */
  private iniBaseContainer(): void {
    let container = document.getElementById(this.options.containerId);
    if (!container) {
      container = ElementBuilder
        .create('div')
        .setAttr('id', this.options.containerId)
        .appendTo('body');
    }

    this.container = ElementBuilder.enhance(container as HTMLDivElement);

    // Добавляем базовый класс, если его еще нет
    if (!this.container.hasClass('coupons-widget')) {
      this.container.addClass('coupons-widget');
    }
  }

  /**
   * Рендеринг виджета
   */
  private render(): void {
    if (!this.container) return;

    // Очищаем контейнер
    this.container.empty();

    const baseContainer = this.elems().baseContainer();

    if (this.data.length === 0) {
      baseContainer.addChild(this.elems().emptyElem());
    } else {
      this.data.forEach(item => {
        baseContainer.addChild(this.elems().listItem(item));
      });
    }

    this.container.addChild(baseContainer);
  }

  /**
   * Предопределенные элементы для виджета
   */
  private elems() {
    return {
      baseContainer: () => {
        return ElementBuilder.div('coupons-list');
      },

      listItem: (item: CouponData) => {
        const itemElement = ElementBuilder.create('div')
          .addClass('list-item');

        // Добавляем статусы как классы
        if (item.current) itemElement.addClass('current');
        if (item.disabled) itemElement.addClass('disabled');

        // Создаем элементы для левого блока (дата и описание)
        const leftBlock = ElementBuilder.div()
          .addChild(
            ElementBuilder.div("elem").addClass("payment-date").addChild(
              ElementBuilder.span("Дата выплаты:", "elem-title"),
              ElementBuilder.span(item.paymentDate, "elem-value"),
            )
          );

        // Создаем элементы для правого блока (ставка и сумма)
        const rightBlock = ElementBuilder.div()
          .addChild(
            ElementBuilder.div("elem").addClass("rate").addChild(
              ElementBuilder.span("Ставка:", "elem-title"),
              ElementBuilder.span(item.rate, "elem-value"),
            ),
            ElementBuilder.div("elem").addClass("amount").addChild(
              ElementBuilder.span("Сумма 1 облигации:", "elem-title"),
              ElementBuilder.span(item.amount, "elem-value"),
            ),
          );

        return itemElement.addChild(leftBlock, rightBlock);
      },

      emptyElem: () => {
        return ElementBuilder.create('div')
          .addClass('empty')
          .setText(this.options.emptyMessage);
      },

      loadingElem: () => {
        return ElementBuilder.create('div')
          .addClass('loading')
          .setText(this.options.loadingMessage);
      },

      errorElem: (message: string) => {
        return ElementBuilder.create('div')
          .addClass('error')
          .setText(`Ошибка: ${message}`);
      }
    };
  }

  /**
   * Загрузка данных с API
   */
  private async loadData(): Promise<void> {
    try {
      this.showLoading();
      if (this.options.isin) {
        await this.loadFromMOEX(this.options.isin);
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  }

  /**
   * Загрузка данных с MOEX API по ISIN
   */
  private async loadFromMOEX(isin: string): Promise<void> {
    const response = await fetch(
      `https://iss.moex.com/iss/securities/${isin}/bondization.json?iss.json=extended&iss.meta=off&iss.only=coupons&lang=ru&limit=unlimited`
    );

    if (!response.ok) {
      throw new Error('Ошибка загрузки данных с MOEX');
    }

    const data = await response.json();
    const coupons = data[1]?.coupons ?? [];

    // Преобразуем данные MOEX в формат виджета
    this.data = this.convertMOEXData(coupons);
    this.render();
  }

  /**
   * Преобразование данных MOEX в формат виджета
   */
  private convertMOEXData(couponsData: any[]): CouponData[] {
    if (couponsData.length === 0 || !couponsData) {
      return [];
    }
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const sortedCoupons = [...couponsData].sort((a, b) =>
      new Date(a.coupondate).getTime() - new Date(b.coupondate).getTime()
    );

    let firstUpcomingIndex = sortedCoupons.findIndex(coupon =>
      new Date(coupon.coupondate) >= currentDate
    );

    if (firstUpcomingIndex === -1) {
      firstUpcomingIndex = sortedCoupons.length;
    }

    const startIndex = Math.max(0, firstUpcomingIndex - 2);
    const endIndex = Math.min(sortedCoupons.length, startIndex === 0 ? firstUpcomingIndex + 5 : firstUpcomingIndex + 3);

    const selectedCoupons = sortedCoupons.slice(startIndex, endIndex);

    const currentCouponDate = firstUpcomingIndex < sortedCoupons.length
      ? sortedCoupons[firstUpcomingIndex].coupondate
      : null;

    return selectedCoupons.map(coupon => {
      const status = this.getCouponStatus(coupon.coupondate, currentDate, currentCouponDate);

      return {
        paymentDate: this.formatDate(coupon.coupondate),
        rate: coupon.valueprc ? `${coupon.valueprc}%` : "-",
        amount: coupon.value_rub ? `${coupon.value_rub}₽` : "-",
        current: status === 'current',
        disabled: status === 'disabled',
      };
    });
  }

  /**
   * Определение статуса купона
   */
  private getCouponStatus(couponDate: string, currentDate: Date, currentCouponDate: string | null): string {
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
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Показать индикатор загрузки
   */
  private showLoading(): void {
    if (!this.container) return;
    this.container.empty().addChild(this.elems().loadingElem());
  }

  /**
   * Показать ошибку
   */
  private showError(message: string): void {
    if (!this.container) return;
    this.container.empty().addChild(this.elems().errorElem(message));
  }

  /**
   * Загрузить данные по ISIN или URL
   */
  public async load(isinOrUrl: string): Promise<void> {
    this.options.isin = isinOrUrl;
    await this.loadData();
  }

  /**
   * Обновить данные
   */
  public updateData(newData: CouponData[]): void {
    this.data = newData;
    this.render();
  }

  /**
   * Уничтожить виджет
   */
  public destroy(): void {
    if (this.container) {
      this.container.empty();
    }
  }

  /**
   * Данные по умолчанию
   */
  private getDefaultData(): CouponData[] {
    return [];
  }
}

// Глобальный экспорт для браузера
if (typeof window !== 'undefined') {
  (window as any).CouponsWidget = CouponsWidget;
}