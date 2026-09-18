import { useEffect, useState, type FormEvent } from "react";
import { useAppContext } from "../context/AppContext";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface OrderEntryProps {
  onClose: () => void;
}

export function OrderEntry({ onClose }: OrderEntryProps) {
  const { products, addOrder, language, t } = useAppContext();
  const {
    transcript,
    isListening,
    error: voiceError,
    startListening,
    stopListening,
  } = useSpeechRecognition();
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transcript) return;
    const quantityMatch = transcript.match(/\d+/);
    const quantityWords: Record<string, string> = {
      एक: "1",
      दो: "2",
      तीन: "3",
      चार: "4",
      five: "5",
    };
    const spokenQuantity =
      quantityMatch?.[0] ??
      Object.entries(quantityWords).find(([word]) =>
        transcript.toLowerCase().includes(word),
      )?.[1];
    const product = products.find((item) =>
      `${item.name} ${item.hindiName}`
        .toLowerCase()
        .split(" ")
        .some((word) => transcript.toLowerCase().includes(word)),
    );
    if (spokenQuantity) setQuantity(spokenQuantity);
    if (product) setProductId(product.id);
    const customer = transcript
      .replace(quantityMatch?.[0] ?? "", "")
      .replace(product?.name ?? "", "")
      .replace(product?.hindiName ?? "", "")
      .trim();
    if (customer) setCustomerName(customer);
  }, [products, transcript]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    if (!customerName.trim() || parsedQuantity < 1) {
      setError(t("orderValidation"));
      return;
    }
    addOrder(
      customerName.trim(),
      productId,
      parsedQuantity,
      price ? Number(price) : null,
    );
    onClose();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-5 mt-5 border border-line bg-[#f8f1e2]/95 p-4 shadow-[3px_4px_0_rgba(106,84,53,.12)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("newOrder")}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-bold text-burgundy"
        >
          {t("close")}
        </button>
      </div>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className="pressable mb-4 w-full border border-burgundy px-3 py-2 text-sm font-bold text-burgundy"
      >
        {isListening ? t("listeningStop") : t("fillByVoice")}
      </button>
      {(voiceError || transcript) && (
        <p className="mb-3 text-xs text-ink-soft">
          {voiceError ? t(voiceError) : `${t("heard")}: ${transcript}`}
        </p>
      )}
      <label className="block text-xs font-bold text-ink-soft">
        {t("customerName")}
        <input
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          className="mt-1 w-full border-b-2 border-line bg-transparent py-2 outline-none focus:border-burgundy"
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-xs font-bold text-ink-soft">
          {t("item")}
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="mt-1 w-full border border-line bg-paper p-2 text-sm text-ink"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {language === "hi" ? product.hindiName : product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-ink-soft">
          {t("quantity")}
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 w-full border border-line bg-paper p-2 text-sm text-ink"
          />
        </label>
      </div>
      <label className="mt-4 block text-xs font-bold text-ink-soft">
        {t("priceOptional")}
        <input
          type="number"
          min="0"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="mt-1 w-full border-b-2 border-line bg-transparent py-2 outline-none focus:border-burgundy"
          placeholder={t("priceLater")}
        />
      </label>
      {error && <p className="mt-3 text-xs font-bold text-due">{error}</p>}
      <button
        type="submit"
        className="pressable mt-5 w-full rounded-md bg-burgundy py-3 font-bold text-[#f8edd4]"
      >
        {t("addOrder")}
      </button>
    </form>
  );
}
