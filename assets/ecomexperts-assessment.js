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
  const optionCount = variants[0]?.options?.length || 0;

  const selectedOptions = new Array(optionCount).fill("");

  modal.querySelectorAll("[data-ee-option-group]").forEach((group) => {
    const optionPosition =
      Number(group.dataset.eeOptionPosition) - 1;

    // Safety check
    if (
      Number.isNaN(optionPosition) ||
      optionPosition < 0 ||
      optionPosition >= optionCount
    ) {
      return;
    }

    // Color / button option
    const selectedButton = group.querySelector(
      "[data-ee-option-value].is-selected",
    );

    if (selectedButton) {
      selectedOptions[optionPosition] =
        selectedButton.dataset.eeOptionValue;

      return;
    }

    // Select option such as Size
    const select = group.querySelector(
      ".ee-product-option__select",
    );

    selectedOptions[optionPosition] =
      select ? select.value : "";
  });

  return selectedOptions;
}


function updateVariant() {
  const selectedOptions = getSelectedOptions();

  // Remove previous Add To Cart success/error message
  if (statusElement) {
    statusElement.textContent = "";
  }

  /*
    User has not completed all variant selections yet.
    Example:
    Color = Blue
    Size = "Choose your size"
  */
  const hasMissingOption = selectedOptions.some(
    (option) => !option,
  );

  if (hasMissingOption) {
    addButton.disabled = true;

    addButton.innerHTML =
      "ADD TO CART <span>→</span>";

    // Important: remove old variant ID
    delete addButton.dataset.variantId;

    return;
  }

  /*
    Find exact Shopify variant from selected options.
  */
  const variant = variants.find((variant) => {
    return variant.options.every(
      (option, index) =>
        option === selectedOptions[index],
    );
  });

  /*
    Combination does not exist.
  */
  if (!variant) {
    addButton.disabled = true;
    addButton.innerHTML = "UNAVAILABLE";

    delete addButton.dataset.variantId;

    return;
  }

  /*
    Correct variant found.
  */
  addButton.dataset.variantId = variant.id;

  if (priceElement) {
    priceElement.textContent = variant.price;
  }

  /*
    Variant exists and can be purchased.
  */
  if (variant.available) {
    addButton.disabled = false;

    addButton.innerHTML =
      "ADD TO CART <span>→</span>";
  } else {
    /*
      Variant exists but Shopify says it's unavailable.
    */
    addButton.disabled = true;
    addButton.innerHTML = "SOLD OUT";
  }
}
updateVariant();

     addButton?.addEventListener("click", async () => {
  const variantId = Number(addButton.dataset.variantId);

  if (!variantId) return;

  /*
   * Get currently selected product options.
   * Example:
   * ["Black", "M"]
   */
  const selectedOptions = getSelectedOptions();

  const normalizedOptions = selectedOptions.map((option) =>
    String(option || "").trim().toLowerCase(),
  );

  /*
   * Assessment requirement:
   * If Black + Medium/M is selected,
   * automatically add Soft Winter Jacket as well.
   */
  const hasBlack = normalizedOptions.includes("black");

  const hasMedium =
    normalizedOptions.includes("medium") ||
    normalizedOptions.includes("m");

  /*
   * Normal product being added.
   */
  const items = [
    {
      id: variantId,
      quantity: 1,
    },
  ];

  /*
   * Bonus product logic
   */
  if (hasBlack && hasMedium) {
    const productGrid = modal.closest(".ee-product-grid");

    const bonusVariantId = Number(
      productGrid?.dataset.eeBonusVariantId,
    );

    if (bonusVariantId && bonusVariantId !== variantId) {
      items.push({
        id: bonusVariantId,
        quantity: 1,
      });
    }
  }

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
          items,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();

      throw new Error(
        error.description || "Unable to add product.",
      );
    }

    await response.json();

    addButton.textContent = "ADDED TO CART ✓";

    if (hasBlack && hasMedium) {
      statusElement.textContent =
        "Product and Soft Winter Jacket added successfully.";
    } else {
      statusElement.textContent =
        "Product added successfully.";
    }

    setTimeout(() => {
      updateVariant();
    }, 1400);

  } catch (error) {
    addButton.disabled = false;
    addButton.innerHTML = originalContent;

    statusElement.textContent =
      error.message || "Something went wrong.";
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

  function initEcomExpertsMobileMenu(root = document) {
  const banners = root.querySelectorAll(".ee-banner");

  banners.forEach((banner) => {
    const toggle = banner.querySelector("[data-ee-mobile-menu-toggle]");
    const menu = banner.querySelector("[data-ee-mobile-menu]");

    if (!toggle || !menu || toggle.dataset.eeMenuInitialized) return;

    toggle.dataset.eeMenuInitialized = "true";

    function closeMenu() {
      menu.hidden = true;

      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }

    function openMenu() {
      menu.hidden = false;

      toggle.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  });
}

  document.addEventListener("DOMContentLoaded", () => {
      initEcomExpertsProducts();
  initEcomExpertsMobileMenu();
  });

  document.addEventListener("shopify:section:load", (event) => {
     initEcomExpertsProducts(event.target);
  initEcomExpertsMobileMenu(event.target);
  });


})();
