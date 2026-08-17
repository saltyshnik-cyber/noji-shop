"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { isBlank, isValidEmail, isValidPhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Параметры упаковки по умолчанию для расчёта доставки СДЭК (усреднённые для ножа).
// TODO: сделать динамическим на основе фактических товаров в корзине.
const DEFAULT_PACKAGE = { weight: 500, length: 20, width: 15, height: 5 };

type CdekTariff = {
  tariffCode: number;
  name: string;
  description: string | null;
  price: number;
  periodMinDays: number;
  periodMaxDays: number;
  kind: "door" | "pvz";
};

type CdekPvz = {
  code: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  workTime: string | null;
  coordinates: { lat: number; lon: number } | null;
};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clear } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<{
    customerName?: string;
    phone?: string;
    email?: string;
    city?: string;
    tariff?: string;
    pvz?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tariffs, setTariffs] = useState<CdekTariff[] | null>(null);
  const [selectedTariff, setSelectedTariff] = useState<CdekTariff | null>(null);
  const [loadingTariffs, setLoadingTariffs] = useState(false);
  const [tariffError, setTariffError] = useState<string | null>(null);
  const lastFetchedCity = useRef("");

  const [pvzList, setPvzList] = useState<CdekPvz[] | null>(null);
  const [selectedPvz, setSelectedPvz] = useState<CdekPvz | null>(null);
  const [loadingPvz, setLoadingPvz] = useState(false);
  const [pvzError, setPvzError] = useState<string | null>(null);
  // Отдельно от pvzError: этот текст должен пережить удаление варианта "самовывоз"
  // из списка тарифов, а не исчезнуть вместе с ним в том же рендере.
  const [noPvzMessage, setNoPvzMessage] = useState<string | null>(null);

  const deliveryPrice = selectedTariff?.price ?? 0;
  const grandTotal = totalPrice + deliveryPrice;

  if (items.length === 0) {
    return (
      <main className="min-w-0">
        <div className="mx-auto max-w-xl px-4 py-10">
          <h1 className="mb-4 text-2xl font-bold">Оформление заказа</h1>
          <p className="text-gray-500">
            Корзина пуста.{" "}
            <Link href="/products" className="text-red-600 hover:underline">
              Перейти в каталог
            </Link>
          </p>
        </div>
      </main>
    );
  }

  async function fetchTariffs(rawCity: string) {
    const targetCity = rawCity.trim();
    setLoadingTariffs(true);
    setTariffError(null);
    setTariffs(null);
    setSelectedTariff(null);
    setPvzList(null);
    setSelectedPvz(null);
    setPvzError(null);
    setNoPvzMessage(null);
    try {
      const res = await fetch("/api/cdek/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_city: targetCity, ...DEFAULT_PACKAGE }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTariffError(data.error ?? "Не удалось рассчитать стоимость доставки");
        return;
      }
      setTariffs(data.tariffs ?? []);
    } catch {
      setTariffError("Не удалось рассчитать доставку. Проверьте соединение.");
    } finally {
      setLoadingTariffs(false);
    }
  }

  async function fetchPvzList(targetCity: string) {
    setLoadingPvz(true);
    setPvzError(null);
    setPvzList(null);
    try {
      const res = await fetch(`/api/cdek/pvz?city=${encodeURIComponent(targetCity)}`);
      const data = await res.json();
      if (!res.ok) {
        setPvzError(data.error ?? "Не удалось загрузить пункты выдачи");
        return;
      }
      const points: CdekPvz[] = data.points ?? [];
      if (points.length === 0) {
        // В городе нет ПВЗ — прячем вариант самовывоза, остаётся только курьер.
        // Сообщение живёт в отдельном состоянии (noPvzMessage), а не в pvzError,
        // иначе оно исчезло бы в том же рендере, где пропадает сам вариант "самовывоз".
        setNoPvzMessage("В этом городе нет пунктов выдачи, доступна только доставка курьером");
        setSelectedTariff(null);
        setTariffs((prev) => (prev ? prev.filter((t) => t.kind !== "pvz") : prev));
        return;
      }
      setPvzList(points);
    } catch {
      setPvzError("Не удалось загрузить пункты выдачи. Проверьте соединение.");
    } finally {
      setLoadingPvz(false);
    }
  }

  function handleCityBlur() {
    const trimmed = city.trim();
    if (isBlank(trimmed)) return;
    if (trimmed === lastFetchedCity.current && (tariffs !== null || loadingTariffs)) return;
    lastFetchedCity.current = trimmed;
    fetchTariffs(trimmed);
  }

  function handleSelectTariff(t: CdekTariff) {
    setSelectedTariff(t);
    setErrors((prev) => ({ ...prev, tariff: undefined }));
    if (t.kind === "pvz") {
      setSelectedPvz(null);
      fetchPvzList(city.trim());
    } else {
      setPvzList(null);
      setSelectedPvz(null);
      setPvzError(null);
    }
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (isBlank(customerName)) next.customerName = "Введите имя";
    if (!isValidPhone(phone)) next.phone = "Формат: +7XXXXXXXXXX";
    if (email && !isValidEmail(email)) next.email = "Некорректный email";
    if (isBlank(city)) {
      next.city = "Введите город доставки";
    } else if (loadingTariffs) {
      next.tariff = "Дождитесь расчёта стоимости доставки";
    } else if (!selectedTariff) {
      next.tariff = "Выберите способ доставки";
    } else if (selectedTariff.kind === "pvz") {
      if (loadingPvz) next.pvz = "Дождитесь загрузки пунктов выдачи";
      else if (!selectedPvz) next.pvz = "Выберите пункт выдачи";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          email: email || undefined,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          city,
          deliveryMethod: selectedTariff!.name,
          deliveryPrice: selectedTariff!.price,
          deliveryType: selectedTariff!.kind,
          pvzAddress: selectedTariff!.kind === "pvz" ? selectedPvz!.address : undefined,
          pvzCode: selectedTariff!.kind === "pvz" ? selectedPvz!.code : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Не удалось оформить заказ");
        return;
      }
      clear();
      router.push(`/order/${data.orderId}`);
    } catch {
      setSubmitError("Не удалось оформить заказ. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-w-0">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">Оформление заказа</h1>

        <div className="mb-6 rounded border border-gray-200 p-4">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between py-1 text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
            </div>
          ))}
          {selectedTariff && (
            <div className="flex justify-between py-1 text-sm">
              <span>Доставка: {selectedTariff.name}</span>
              <span>{deliveryPrice.toLocaleString("ru-RU")} ₽</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>Итого</span>
            <span>{grandTotal.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="customerName">
              Имя
            </label>
            <input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="phone">
              Телефон
            </label>
            <input
              id="phone"
              placeholder="+79991234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email (необязательно)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="city">
              Город доставки
            </label>
            <input
              id="city"
              placeholder="Москва"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setTariffs(null);
                setSelectedTariff(null);
                setTariffError(null);
                setPvzList(null);
                setSelectedPvz(null);
                setPvzError(null);
                setNoPvzMessage(null);
              }}
              onBlur={handleCityBlur}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            {tariffError && <p className="mt-1 text-sm text-red-600">{tariffError}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Способ доставки</label>

            {loadingTariffs && (
              <div className="flex items-center gap-2 py-1 text-sm text-gray-500">
                <Spinner />
                Расчёт стоимости доставки…
              </div>
            )}

            {!loadingTariffs && tariffs && tariffs.length > 0 && (
              <div className="flex flex-col gap-2">
                {tariffs.map((t) => (
                  <div key={t.tariffCode}>
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded border border-gray-300 px-3 py-2 text-sm transition has-[:checked]:border-red-600 has-[:checked]:bg-red-50">
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryTariff"
                          checked={selectedTariff?.tariffCode === t.tariffCode}
                          onChange={() => handleSelectTariff(t)}
                        />
                        {t.name}
                      </span>
                      <span className="whitespace-nowrap font-medium">
                        {t.price.toLocaleString("ru-RU")} ₽,{" "}
                        {t.periodMinDays === t.periodMaxDays
                          ? `${t.periodMinDays} дн.`
                          : `${t.periodMinDays}-${t.periodMaxDays} дн.`}
                      </span>
                    </label>

                    {t.kind === "pvz" && selectedTariff?.tariffCode === t.tariffCode && (
                      <div className="mt-2 ml-4 flex flex-col gap-2 border-l-2 border-gray-100 pl-3">
                        {loadingPvz && (
                          <div className="flex items-center gap-2 py-1 text-sm text-gray-500">
                            <Spinner />
                            Загрузка пунктов выдачи…
                          </div>
                        )}

                        {!loadingPvz && pvzError && <p className="text-sm text-red-600">{pvzError}</p>}

                        {!loadingPvz && pvzList && pvzList.length > 0 && (
                          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                            {pvzList.map((p) => (
                              <label
                                key={p.code}
                                className="flex cursor-pointer items-start gap-2 rounded border border-gray-300 px-3 py-2 text-sm transition has-[:checked]:border-red-600 has-[:checked]:bg-red-50"
                              >
                                <input
                                  type="radio"
                                  name="pvz"
                                  className="mt-1"
                                  checked={selectedPvz?.code === p.code}
                                  onChange={() => {
                                    setSelectedPvz(p);
                                    setErrors((prev) => ({ ...prev, pvz: undefined }));
                                  }}
                                />
                                <span>
                                  <span className="block">{p.address}</span>
                                  {p.workTime && <span className="block text-xs text-gray-500">{p.workTime}</span>}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {errors.pvz && <p className="text-sm text-red-600">{errors.pvz}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {noPvzMessage && <p className="mt-1 text-sm text-gray-500">{noPvzMessage}</p>}
            {errors.tariff && <p className="mt-1 text-sm text-red-600">{errors.tariff}</p>}
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded bg-red-800 px-6 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? "Отправка…" : "Подтвердить заказ"}
          </button>
        </form>
      </div>
    </main>
  );
}
