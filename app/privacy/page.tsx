import Link from "next/link";
import { getSiteSettings, phoneToTelHref } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/" className="mb-6 inline-block text-sm text-red-900 transition hover:text-red-700">
          ← На главную
        </Link>

        <h1 className="mb-2 text-2xl font-bold">Политика конфиденциальности</h1>
        <p className="mb-8 text-sm text-gray-500">
          Политика обработки персональных данных сайта «{settings.shopName}»
        </p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
              пользователей сайта «{settings.shopName}» (далее — «Сайт»), которые Продавец может получить в процессе
              оформления и исполнения заказа. Обработка персональных данных осуществляется в соответствии с
              Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">2. Какие данные собираются</h2>
            <p>При оформлении заказа на Сайте собираются следующие персональные данные:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>имя;</li>
              <li>номер телефона;</li>
              <li>адрес электронной почты (при указании);</li>
              <li>город и адрес доставки, включая выбранный пункт выдачи заказов.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">3. Цели обработки данных</h2>
            <p>Персональные данные обрабатываются исключительно в целях:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>оформления и исполнения заказа Покупателя;</li>
              <li>организации доставки Товара;</li>
              <li>связи с Покупателем по вопросам заказа;</li>
              <li>исполнения обязательств, предусмотренных законодательством РФ.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">4. Передача данных третьим лицам</h2>
            <p>
              Персональные данные могут передаваться третьим лицам исключительно в объёме, необходимом для
              исполнения заказа: транспортной компании СДЭК — для организации доставки, платёжному сервису ЮKassa —
              для обработки оплаты. Продавец не передаёт персональные данные третьим лицам в иных целях, в том числе
              в рекламных, без согласия Покупателя.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">5. Хранение и защита данных</h2>
            <p>
              Персональные данные хранятся в течение срока, необходимого для исполнения заказа и требований
              законодательства РФ, и защищаются с использованием организационных и технических мер, соответствующих
              характеру обрабатываемых данных.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">6. Права субъекта персональных данных</h2>
            <p>
              Покупатель вправе запросить информацию об обрабатываемых персональных данных, потребовать их
              уточнения, блокирования или уничтожения в случаях, предусмотренных законодательством РФ, обратившись
              к Продавцу по контактам ниже.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-gray-900">7. Контакты</h2>
            <p>
              По вопросам обработки персональных данных обращайтесь:
              <br />
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
