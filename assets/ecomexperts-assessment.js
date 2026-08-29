(() => {
  function initEcomExpertsProducts(root = document) {
    const openButtons = root.querySelectorAll(
      "[data-ee-open-modal]:not([data-ee-initialized])",
    );

    openButtons.forEach((button) => {
      button.dataset.eeInitialized = "true";

      button.addEventListener("click", () => {
        const modalId = button.dataset.eeOpenModal;
        const modal = document.getElementById(modalId);

        if (!modal) return;

        modal.hidden = false;
        document.body.style.overflow = "hidden";
      });
    });

    root.querySelectorAll(".ee-product-modal").forEach((modal) => {
      if (modal.dataset.eeInitialized) return;

      modal.dataset.eeInitialized = "true";

      const variantScript = modal.querySelector(".ee-product-modal__variants");

      const variants = variantScript
        ? JSON.parse(variantScript.textContent)
        : [];

      const addButton = modal.querySelector("[data-ee-add-to-cart]");
      const priceElement = modal.querySelector("[data-ee-product-price]");

      const statusElement = modal.querySelector("[data-ee-cart-status]");

      function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = "";
      }

      modal.querySelectorAll("[data-ee-close-modal]").forEach((button) => {
        button.addEventListener("click", closeModal);
      });

      modal.querySelectorAll("[data-ee-option-value]").forEach((button) => {
        button.addEventListener("click", () => {
          const group = button.closest("[data-ee-option-group]");

          group.querySelectorAll("[data-ee-option-value]").forEach((item) => {
            item.classList.remove("is-selected");
          });

          button.classList.add("is-selected");

          updateVariant();
        });
      });

      modal.querySelectorAll(".ee-product-option__select").forEach((select) => {
        select.addEventListener("change", updateVariant);
      });

      function getSelectedOptions() {
        return [...modal.querySelectorAll("[data-ee-option-group]")].map(
          (group) => {
            const selectedButton = group.querySelector(
              "[data-ee-option-value].is-selected",
            );

            if (selectedButton) {
              return selectedButton.dataset.eeOptionValue;
            }

            const select = group.querySelector(".ee-product-option__select");

            return select ? select.value : "";
          },
        );
      }

      function updateVariant() {
        const selectedOptions = getSelectedOptions();

        const variant = variants.find((variant) => {
          return variant.options.every(
            (option, index) => option === selectedOptions[index],
          );
        });

        if (!variant) {
          addButton.disabled = true;
          addButton.innerHTML = "UNAVAILABLE";

          return;
        }

        addButton.dataset.variantId = variant.id;

        if (priceElement) {
          priceElement.textContent = variant.price;
        }

        if (variant.available) {
          addButton.disabled = false;

          addButton.innerHTML = "ADD TO CART <span>→</span>";
        } else {
          addButton.disabled = true;
          addButton.innerHTML = "SOLD OUT";
        }
      }

      addButton?.addEventListener("click", async () => {
        const variantId = Number(addButton.dataset.variantId);

        if (!variantId) return;

        const originalContent = addButton.innerHTML;

        addButton.disabled = true;
        addButton.textContent = "ADDING...";

        statusElement.textContent = "";

        try {
          const response = await fetch(
            window.Shopify.routes.root + "cart/add.js",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                items: [
                  {
                    id: variantId,
                    quantity: 1,
                  },
                ],
              }),
            },
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.description || "Unable to add product.");
          }

          await response.json();

          addButton.textContent = "ADDED TO CART ✓";
          statusElement.textContent = "Product added successfully.";

          setTimeout(() => {
            updateVariant();
          }, 1400);
        } catch (error) {
          addButton.disabled = false;
          addButton.innerHTML = originalContent;

          statusElement.textContent = error.message || "Something went wrong.";
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      document
        .querySelectorAll(".ee-product-modal:not([hidden])")
        .forEach((modal) => {
          modal.hidden = true;
        });

      document.body.style.overflow = "";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initEcomExpertsProducts();
  });

  document.addEventListener("shopify:section:load", (event) => {
    initEcomExpertsProducts(event.target);
  });
})();
