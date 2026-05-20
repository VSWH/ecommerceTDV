import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Pencil,
  Trash2,
  X,
  Save,
  Zap,
  Package,
  ShieldCheck,
} from "lucide-react";

const API_BASE_URL = "http://3.80.46.18:8000";
const ADMIN_PASSWORD = "123";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "",
  is_active: true,
  image_url: "",
  category_id: "",
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  const [isCartOpen, setIsCartOpen] = useState(false);

  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem("tdv_cart");

      if (storedCart) {
        return JSON.parse(storedCart);
      }

      return [];
    } catch {
      return [];
    }
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("tdv_admin") === "true";
  });

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/catalog/?active_only=false`),
        fetch(`${API_BASE_URL}/categories/`),
      ]);

      if (!productsResponse.ok || !categoriesResponse.ok) {
        throw new Error("Erro ao buscar dados da API.");
      }

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(
        "Não foi possível carregar os dados. Verifique se o back-end FastAPI está rodando."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("tdv_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        String(product.category_id || "") === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const cartCount = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  const cartTotal = cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  function getCategoryName(categoryId) {
    const category = categories.find((item) => item.id === categoryId);
    return category ? category.name : "Sem categoria";
  }

  function formatPrice(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function handleAdminLogin(event) {
    event.preventDefault();

    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem("tdv_admin", "true");
      setShowAdminLogin(false);
      setAdminPassword("");
      setAdminError("");
      return;
    }

    setAdminError("Senha incorreta. Tente novamente.");
  }

  function handleAdminLogout() {
    setIsAdmin(false);
    localStorage.removeItem("tdv_admin");
    setAdminPassword("");
    setAdminError("");
    setShowForm(false);
    setEditingProduct(null);
  }

  function addToCart(product) {
    if (product.stock_quantity <= 0) {
      alert("Produto sem estoque disponível.");
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (existingItem) {
        return currentItems.map((item) => {
          if (item.id === product.id) {
            const nextQuantity = item.quantity + 1;

            return {
              ...item,
              quantity:
                nextQuantity > product.stock_quantity
                  ? product.stock_quantity
                  : nextQuantity,
            };
          }

          return item;
        });
      }

      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          quantity: 1,
        },
      ];
    });

    setIsCartOpen(true);
  }

  function increaseCartItem(productId) {
    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === productId) {
          const nextQuantity = item.quantity + 1;

          return {
            ...item,
            quantity:
              nextQuantity > item.stock_quantity
                ? item.stock_quantity
                : nextQuantity,
          };
        }

        return item;
      })
    );
  }

  function decreaseCartItem(productId) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id === productId) {
            return {
              ...item,
              quantity: item.quantity - 1,
            };
          }

          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeCartItem(productId) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId)
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  function openCreateForm() {
    setEditingProduct(null);
    setForm(emptyProduct);
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock_quantity: String(product.stock_quantity ?? ""),
      is_active: Boolean(product.is_active),
      image_url: product.image_url || "",
      category_id: product.category_id ? String(product.category_id) : "",
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyProduct);
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      is_active: Boolean(form.is_active),
      image_url: form.image_url || null,
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    const url = editingProduct
      ? `${API_BASE_URL}/catalog/${editingProduct.id}`
      : `${API_BASE_URL}/catalog/`;

    const method = editingProduct ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar produto.");
      }

      closeForm();
      fetchData();
    } catch (err) {
      setError("Erro ao salvar produto. Confira os campos e tente novamente.");
    }
  }

  async function handleDelete(productId) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este produto?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/catalog/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Erro ao excluir produto.");
      }

      fetchData();
    } catch (err) {
      setError("Erro ao excluir produto.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-yellow-400/40 bg-black text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-md">
              <Zap size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight">
                TDV Elétrica
              </h1>
              <p className="text-sm text-zinc-300">
                Materiais elétricos com catálogo integrado ao FastAPI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="rounded-2xl border border-yellow-400 px-4 py-2 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
              >
                Sair do admin
              </button>
            ) : (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="rounded-2xl border border-yellow-400 px-4 py-2 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
              >
                Área Admin
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black shadow-sm transition hover:bg-yellow-300"
            >
              <ShoppingCart size={18} />
              Carrinho

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-black">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-black via-zinc-950 to-zinc-900 p-8 text-white shadow-xl ring-1 ring-yellow-400/30">
          <div className="grid gap-8 md:grid-cols-[1.4fr_0.8fr] md:items-center">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
                Laboratório de Engenharia de Software
              </p>

              <h2 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
                Catálogo de materiais elétricos
              </h2>

              <p className="max-w-2xl text-base leading-7 text-zinc-300">
                Tomadas, interruptores, disjuntores, barramentos e acessórios
                elétricos conectados diretamente ao seu back-end em Python com
                FastAPI.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-black">
                  Produtos elétricos
                </span>
                <span className="rounded-full border border-yellow-400/40 px-4 py-2 text-sm font-semibold text-yellow-300">
                  Estoque atualizado
                </span>
                <span className="rounded-full border border-yellow-400/40 px-4 py-2 text-sm font-semibold text-yellow-300">
                  Integração FastAPI
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-yellow-400/30 bg-white/5 p-5 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Sistema</p>
                  <p className="font-bold">Catálogo Online TDV</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/40 p-4">
                  <p className="text-2xl font-black text-yellow-400">
                    {products.length}
                  </p>
                  <p className="text-sm text-zinc-400">Produtos</p>
                </div>

                <div className="rounded-2xl bg-black/40 p-4">
                  <p className="text-2xl font-black text-yellow-400">
                    {categories.length}
                  </p>
                  <p className="text-sm text-zinc-400">Categorias</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`mb-6 grid gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm ${
            isAdmin ? "md:grid-cols-[1fr_240px_auto]" : "md:grid-cols-[1fr_240px]"
          }`}
        >
          <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 focus-within:border-yellow-400">
            <Search size={20} className="text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar tomada, disjuntor, interruptor..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-400"
          >
            <option value="all">Todas as categorias</option>

            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>

          {isAdmin && (
            <button
              onClick={openCreateForm}
              className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
            >
              <Plus size={18} />
              Novo produto
            </button>
          )}
        </section>

        {isAdmin && (
          <div className="mb-6 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-900">
            Modo administrador ativo. Você pode cadastrar, editar e excluir
            produtos.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
            Carregando produtos elétricos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
            Nenhum produto encontrado.
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-yellow-400 hover:shadow-lg"
              >
                <div className="aspect-square bg-zinc-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-zinc-400">
                      <Package size={38} className="mb-2" />
                      Imagem não cadastrada
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black">{product.name}</h3>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-yellow-700">
                        {getCategoryName(product.category_id)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        product.is_active
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {product.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <p className="mb-4 min-h-[4.5rem] text-sm leading-6 text-zinc-600">
                    {product.description || "Produto sem descrição cadastrada."}
                  </p>

                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Preço</p>
                      <p className="text-xl font-black">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-right">
                      <p className="text-xs text-zinc-500">Estoque</p>
                      <p className="text-sm font-bold">
                        {product.stock_quantity} un.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="mb-3 w-full rounded-2xl bg-black px-4 py-3 text-sm font-bold text-yellow-400 transition hover:bg-zinc-800"
                  >
                    Comprar
                  </button>

                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openEditForm(product)}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {showForm && isAdmin && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  {editingProduct ? "Editar produto" : "Novo produto"}
                </h2>
                <p className="text-sm text-zinc-500">
                  Preencha os dados do material elétrico.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-2 hover:bg-zinc-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-bold">
                  Nome do produto
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-bold">Descrição</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-bold">Preço</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-bold">Estoque</span>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(event) =>
                    updateForm("stock_quantity", event.target.value)
                  }
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-bold">Categoria</span>
                <select
                  value={form.category_id}
                  onChange={(event) =>
                    updateForm("category_id", event.target.value)
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-400"
                >
                  <option value="">Sem categoria</option>

                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-sm font-bold">
                  URL da imagem
                </span>
                <input
                  value={form.image_url}
                  onChange={(event) =>
                    updateForm("image_url", event.target.value)
                  }
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateForm("is_active", event.target.checked)
                  }
                />
                <span className="text-sm font-bold">Produto ativo</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-bold hover:bg-zinc-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300"
              >
                <Save size={18} />
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60">
          <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 p-5">
              <div>
                <h2 className="text-2xl font-black">Carrinho</h2>
                <p className="text-sm text-zinc-500">
                  {cartCount} item(ns) selecionado(s)
                </p>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-2 hover:bg-zinc-100"
              >
                <X size={22} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-zinc-100 p-5">
                  <ShoppingCart size={38} className="text-zinc-400" />
                </div>

                <h3 className="text-lg font-black">Seu carrinho está vazio</h3>

                <p className="mt-2 text-sm text-zinc-500">
                  Adicione produtos elétricos ao carrinho para simular uma
                  compra.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm"
                    >
                      <div className="h-20 w-20 overflow-hidden rounded-2xl bg-zinc-100">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package size={26} className="text-zinc-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-black">{item.name}</h3>

                          <p className="mt-1 text-sm font-bold text-yellow-700">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => decreaseCartItem(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="w-6 text-center text-sm font-black">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => increaseCartItem(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeCartItem(item.id)}
                            className="rounded-full p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-200 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-500">
                      Total
                    </span>
                    <span className="text-2xl font-black">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>

                  <button className="mb-3 w-full rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black hover:bg-yellow-300">
                    Finalizar compra
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-bold hover:bg-zinc-50"
                  >
                    Limpar carrinho
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleAdminLogin}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Área Admin</h2>
                <p className="text-sm text-zinc-500">
                  Digite a senha para gerenciar produtos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminPassword("");
                  setAdminError("");
                }}
                className="rounded-full p-2 hover:bg-zinc-100"
              >
                <X size={22} />
              </button>
            </div>

            <label>
              <span className="mb-1 block text-sm font-bold">Senha</span>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                placeholder="Digite a senha de administrador"
              />
            </label>

            {adminError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {adminError}
              </div>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black hover:bg-yellow-300"
            >
              Entrar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}