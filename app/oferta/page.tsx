import Link from "next/link";
import type { Metadata } from "next";
import { getSiteSettings, phoneToTelHref } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: `Публичная оферта | ${settings.shopName}`,
    description: `Условия продажи, оплаты и доставки товаров интернет-магазина «${settings.shopName}».`,
    alternates: { canonical: "/oferta" },
  };
}

export default async function OfertaPage() {
  const settings = await getSiteSettings();

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/" className="mb-6 inline-block text-sm text-red-900 transition hover:text-red-700">
          ← На главную
        </Link>

        <h1 className="mb-2 text-2xl font-bold">Публичная оферта</h1>
        <p className="mb-8 text-sm text-gray-500">Договор розничной купли-продажи (публичная оферта)</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">1. Общие положения</h2>
            <p>
              Настоящий документ является официальным предложением (публичной офертой) {settings.legalName} (далее —
              «Продавец») в адрес любого физического лица (далее — «Покупатель») заключить договор розничной
              купли-продажи товаров, представленных на сайте «{settings.shopName}» (далее — «Сайт»), на условиях,
              изложенных ниже.
            </p>
            <p className="mt-2">
              Оформление заказа на Сайте означает полное и безоговорочное принятие (акцепт) Покупателем условий
              настоящей оферты.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">2. Предмет договора</h2>
            <p>
              Продавец обязуется передать в собственность Покупателя кованые ножи ручной работы и сопутствующие
              товары (далее — «Товар»), а Покупатель обязуется оплатить и принять Товар на условиях настоящего
              договора. Ассортимент, характеристики и цены Товаров указаны на страницах Сайта.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">3. Оформление заказа</h2>
            <p>
              Заказ оформляется Покупателем самостоятельно на Сайте путём добавления Товара в корзину и заполнения
              формы оформления заказа (имя, телефон, город и способ доставки). Продавец вправе связаться с
              Покупателем по указанным контактным данным для подтверждения заказа.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">4. Цена и порядок оплаты</h2>
            <p>
              Цены на Товары указаны на Сайте в российских рублях и включают все применимые налоги. Стоимость
              доставки рассчитывается отдельно и добавляется к стоимости заказа перед оплатой. Оплата производится
              банковской картой онлайн через платёжный сервис ЮKassa либо иным способом, указанным на Сайте на
              момент оформления заказа.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">5. Доставка</h2>
            <p>
              Доставка Товара осуществляется транспортной компанией СДЭК — курьером до двери либо самовывозом из
              пункта выдачи заказов, по выбору Покупателя на этапе оформления заказа. Сроки и стоимость доставки
              рассчитываются автоматически на Сайте исходя из города получателя.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">6. Возврат и обмен</h2>
            <p>
              Возврат и обмен Товара надлежащего качества осуществляются в соответствии с Законом РФ «О защите прав
              потребителей». Обращаем внимание, что ножевые изделия относятся к категории товаров, в отношении
              которых законодательством может быть ограничена возможность обмена и возврата товара надлежащего
              качества. Товар ненадлежащего качества подлежит возврату или обмену в соответствии с законодательством
              РФ — для этого свяжитесь с Продавцом по контактам, указанным ниже.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">7. Ответственность сторон</h2>
            <p>
              Стороны несут ответственность за неисполнение или ненадлежащее исполнение условий настоящего договора
              в порядке, предусмотренном действующим законодательством РФ.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">8. Реквизиты Продавца</h2>
            <p>
              Полные реквизиты Продавца указаны на странице{" "}
              <Link href="/requisites" className="text-red-700 hover:underline">
                «Реквизиты продавца»
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">9. Контакты</h2>
            <p>
              Телефон:{" "}
              <a href={phoneToTelHref(settings.contactPhone)} className="text-red-700 hover:underline">
                {settings.contactPhone}
              </a>
              <br />
              Email:{" "}
              <a href={`mailto:${settings.contactEmail}`} className="text-red-700 hover:underline">
                {settings.contactEmail}
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
