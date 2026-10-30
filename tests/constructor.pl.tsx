import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import type { Locator, Page } from '@playwright/test';

const HARS_DIR = path.resolve('tests/hars');
const BASE_URL = 'http://localhost:4000';

const ACCESS_TOKEN = 'Bearer test-access-token';
const REFRESH_TOKEN = 'test-refresh-token';

type THar = {
  log: {
    entries: { response: { content: { text?: string } } }[];
  };
};

type TMockIngredient = {
  _id: string;
  name: string;
  type: string;
  price: number;
  calories: number;
  proteins: number;
  fat: number;
  carbohydrates: number;
};

const harPath = (name: string): string => path.join(HARS_DIR, `${name}.har`);

/**
 * Ожидаемые значения в тестах берутся из тех же HAR-файлов, которые подменяют
 * ответы бэкенда, поэтому данные в моке и в проверках не могут разойтись.
 */
const readHarBody = <T,>(name: string): T => {
  const har = JSON.parse(fs.readFileSync(harPath(name), 'utf8')) as THar;
  const text = har.log.entries[0]?.response.content.text;

  if (!text) {
    throw new Error(`В HAR-файле ${name}.har нет тела ответа`);
  }

  return JSON.parse(text) as T;
};

const mockIngredients = readHarBody<{ data: TMockIngredient[] }>('ingredients').data;

const pickIngredients = (type: string): TMockIngredient[] => {
  const found = mockIngredients.filter((item) => item.type === type);

  if (found.length === 0) {
    throw new Error(`В ingredients.har нет ингредиентов типа «${type}»`);
  }

  return found;
};

const [BUN, ANOTHER_BUN] = pickIngredients('bun');
const [MAIN] = pickIngredients('main');
const [SAUCE] = pickIngredients('sauce');

const ORDER_NUMBER = String(
  readHarBody<{ order: { number: number } }>('order').order.number
);

const mockIngredientsRequest = async (page: Page): Promise<void> => {
  await page.routeFromHAR(harPath('ingredients'), {
    url: '**/api/ingredients',
    notFound: 'abort',
  });
};

const mockOrderRequests = async (page: Page): Promise<void> => {
  await page.routeFromHAR(harPath('user'), {
    url: '**/api/auth/user',
    notFound: 'abort',
  });
  await page.routeFromHAR(harPath('order'), {
    url: '**/api/orders',
    notFound: 'abort',
  });
};

const setFakeAuthTokens = async (page: Page): Promise<void> => {
  await page.context().addCookies([
    {
      name: 'accessToken',
      value: encodeURIComponent(ACCESS_TOKEN),
      url: BASE_URL,
    },
  ]);
  await page.addInitScript((token: string) => {
    localStorage.setItem('refreshToken', token);
  }, REFRESH_TOKEN);
};

const getIngredientCard = (page: Page, ingredient: TMockIngredient): Locator =>
  page
    .getByTestId('ingredients-content')
    .getByRole('listitem')
    .filter({ hasText: ingredient.name });

const addToConstructor = async (
  page: Page,
  ingredient: TMockIngredient
): Promise<void> => {
  await getIngredientCard(page, ingredient)
    .getByRole('button', { name: 'Добавить' })
    .click();
};

const getModal = (page: Page): Locator => page.locator('#modals');

const openIngredientModal = async (
  page: Page,
  ingredient: TMockIngredient
): Promise<void> => {
  await getIngredientCard(page, ingredient).getByRole('link').click();
  await expect(getModal(page).getByText('Детали ингредиента')).toBeVisible();
};

const expectIngredientModalClosed = async (page: Page): Promise<void> => {
  await expect(getModal(page).getByText('Детали ингредиента')).toHaveCount(0);
  await expect(page.getByTestId('modal-overlay')).toHaveCount(0);
  await expect(page).toHaveURL('/');
};

const expectConstructorEmpty = async (page: Page): Promise<void> => {
  const burgerConstructor = page.getByTestId('constructor');

  await expect(page.getByTestId('constructor-bun-1')).toHaveCount(0);
  await expect(page.getByTestId('constructor-bun-2')).toHaveCount(0);
  await expect(
    page.getByTestId('constructor-ingredients').getByRole('listitem')
  ).toHaveCount(1);
  await expect(burgerConstructor.getByText('Выберите булки')).toHaveCount(2);
  await expect(burgerConstructor.getByText('Выберите начинку')).toBeVisible();
  await expect(page.getByTestId('order-summ').locator('p')).toHaveText('0');
};

test.describe('Добавление ингредиентов в конструктор', () => {
  test.beforeEach(async ({ page }) => {
    await mockIngredientsRequest(page);
    await page.goto('/');
  });

  test('в пустом конструкторе показаны подсказки и нулевая стоимость', async ({
                                                                                page,
                                                                              }) => {
    await expectConstructorEmpty(page);
  });

  test('булка добавляется в конструктор сверху и снизу и учитывается в цене дважды', async ({
                                                                                              page,
                                                                                            }) => {
    await addToConstructor(page, BUN);

    await expect(page.getByTestId('constructor-bun-1')).toContainText(
      `${BUN.name} (верх)`
    );
    await expect(page.getByTestId('constructor-bun-2')).toContainText(
      `${BUN.name} (низ)`
    );
    await expect(page.getByTestId('order-summ').locator('p')).toHaveText(
      String(BUN.price * 2)
    );
  });

  test('при добавлении другой булки она заменяет предыдущую', async ({ page }) => {
    await addToConstructor(page, BUN);
    await addToConstructor(page, ANOTHER_BUN);

    await expect(page.getByTestId('constructor-bun-1')).toContainText(ANOTHER_BUN.name);
    await expect(page.getByTestId('constructor-bun-2')).toContainText(ANOTHER_BUN.name);
    await expect(page.getByTestId('constructor')).not.toContainText(BUN.name);
    await expect(page.getByTestId('order-summ').locator('p')).toHaveText(
      String(ANOTHER_BUN.price * 2)
    );
  });

  test('начинка и соус добавляются в список начинок конструктора', async ({ page }) => {
    await addToConstructor(page, MAIN);
    await addToConstructor(page, SAUCE);

    const fillings = page.getByTestId('constructor-ingredients');

    await expect(fillings.getByRole('listitem')).toHaveCount(2);
    await expect(fillings).toContainText(MAIN.name);
    await expect(fillings).toContainText(SAUCE.name);
    await expect(page.getByTestId('order-summ').locator('p')).toHaveText(
      String(MAIN.price + SAUCE.price)
    );
  });
});

test.describe('Модальное окно с описанием ингредиента', () => {
  test.beforeEach(async ({ page }) => {
    await mockIngredientsRequest(page);
    await page.goto('/');
  });

  for (const ingredient of [BUN, MAIN, SAUCE]) {
    test(`открывается по клику и показывает данные ингредиента «${ingredient.name}»`, async ({
                                                                                               page,
                                                                                             }) => {
      await openIngredientModal(page, ingredient);

      const modal = getModal(page);

      await expect(modal.getByRole('heading', { name: ingredient.name })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/ingredients/${ingredient._id}$`));

      const nutrition: [string, number][] = [
        ['Калории, ккал', ingredient.calories],
        ['Белки, г', ingredient.proteins],
        ['Жиры, г', ingredient.fat],
        ['Углеводы, г', ingredient.carbohydrates],
      ];

      for (const [label, value] of nutrition) {
        await expect(
          modal.getByRole('listitem').filter({ hasText: label })
        ).toContainText(String(value));
      }
    });
  }

  test('не показывает данные других ингредиентов', async ({ page }) => {
    await openIngredientModal(page, MAIN);

    const modal = getModal(page);

    await expect(modal.getByRole('heading', { name: MAIN.name })).toBeVisible();
    await expect(modal).not.toContainText(BUN.name);
    await expect(modal).not.toContainText(SAUCE.name);
  });

  test('закрывается по клику на крестик', async ({ page }) => {
    await openIngredientModal(page, MAIN);

    await getModal(page).getByRole('button', { name: 'Закрыть' }).click();

    await expectIngredientModalClosed(page);
  });

  test('закрывается по клику на оверлей', async ({ page }) => {
    await openIngredientModal(page, MAIN);

    await page.getByTestId('modal-overlay').click({ position: { x: 5, y: 5 } });

    await expectIngredientModalClosed(page);
  });

  test('закрывается по нажатию на Escape', async ({ page }) => {
    await openIngredientModal(page, MAIN);

    await page.keyboard.press('Escape');

    await expectIngredientModalClosed(page);
  });
});

test.describe('Оформление заказа', () => {
  test.beforeEach(async ({ page }) => {
    await setFakeAuthTokens(page);
    await mockIngredientsRequest(page);
    await mockOrderRequests(page);
    await page.goto('/');
  });

  test('перед заказом в cookie и localStorage подставлены фейковые токены', async ({
                                                                                     page,
                                                                                   }) => {
    const cookies = await page.context().cookies(BASE_URL);
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

    expect(cookies.find((cookie) => cookie.name === 'accessToken')?.value).toBe(
      encodeURIComponent(ACCESS_TOKEN)
    );
    expect(refreshToken).toBe(REFRESH_TOKEN);
  });

  test('заказ создаётся: открывается модальное окно с номером заказа, конструктор очищается, окно закрывается', async ({
                                                                                                                         page,
                                                                                                                       }) => {
    await addToConstructor(page, BUN);
    await addToConstructor(page, MAIN);
    await addToConstructor(page, SAUCE);

    await expect(page.getByTestId('order-summ').locator('p')).toHaveText(
      String(BUN.price * 2 + MAIN.price + SAUCE.price)
    );

    await page.getByRole('button', { name: 'Оформить заказ' }).click();

    await expect(page.getByTestId('order-number')).toHaveText(ORDER_NUMBER);
    await expect(getModal(page).getByText('Ваш заказ начали готовить')).toBeVisible();

    await expectConstructorEmpty(page);

    await getModal(page).getByRole('button', { name: 'Закрыть' }).click();

    await expect(page.getByTestId('order-number')).toHaveCount(0);
    await expect(getModal(page).getByRole('button', { name: 'Закрыть' })).toHaveCount(0);
  });
});
