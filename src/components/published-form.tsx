"use client";

import { useEffect } from "react";

interface PublishedFormHydratorProps {
  pageId: string;
  accentColor: string;
}

export function PublishedFormHydrator({
  pageId,
  accentColor,
}: PublishedFormHydratorProps) {
  useEffect(() => {
    const formBlocks = document.querySelectorAll<HTMLDivElement>(
      'div[data-type="form-block"]'
    );

    const controllers: AbortController[] = [];

    formBlocks.forEach((block) => {
      const formId = block.getAttribute("data-form-id") || "";
      const successMessage =
        block.getAttribute("data-success-message") || "Thank you!";
      const form = block.querySelector("form");
      if (!form) return;

      // Style submit button with accent color
      const submitBtn = form.querySelector<HTMLButtonElement>(
        'button[type="submit"]'
      );
      if (submitBtn) {
        submitBtn.style.backgroundColor = accentColor;
      }

      // Use a single AbortController per form for all listeners (focus, blur, submit)
      const controller = new AbortController();
      controllers.push(controller);

      // Style focus states — attach with signal so cleanup removes them
      const inputs = form.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >("input, textarea");
      inputs.forEach((input) => {
        input.addEventListener("focus", () => {
          input.style.borderColor = accentColor;
          input.style.boxShadow = `0 0 0 2px ${accentColor}26`;
        }, { signal: controller.signal });
        input.addEventListener("blur", () => {
          input.style.borderColor = "#d1d5db";
          input.style.boxShadow = "none";
        }, { signal: controller.signal });
      });

      form.addEventListener(
        "submit",
        async (e) => {
          e.preventDefault();
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting...";
          }

          // Collect form data
          const formData = new FormData(form);
          const data: Record<string, string> = {};
          formData.forEach((value, key) => {
            data[key] = value.toString();
          });

          try {
            const res = await fetch("/api/forms/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pageId, formId, data }),
            });

            const resetBtn = () => {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent =
                  form
                    .closest('div[data-type="form-block"]')
                    ?.getAttribute("data-submit-label") || "Submit";
              }
            };

            const showError = (message: string) => {
              resetBtn();
              // Remove any previous error
              form.querySelector("[data-form-error]")?.remove();
              const err = document.createElement("p");
              err.setAttribute("data-form-error", "true");
              err.style.cssText =
                "color:#dc2626;font-size:13px;margin-top:8px;text-align:center;";
              err.textContent = message;
              form.appendChild(err);
            };

            if (res.ok) {
              // Show success message with dopamine animation — use textContent to prevent XSS
              while (form.firstChild) form.removeChild(form.firstChild);

              const wrapper = document.createElement("div");
              wrapper.style.cssText = "text-align:center;padding:24px 0;opacity:0;transform:scale(0);animation:dopamine-bounce 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;";

              const iconWrap = document.createElement("div");
              iconWrap.style.cssText = `width:56px;height:56px;border-radius:50%;background:${accentColor}1a;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;box-shadow:0 0 0 0 ${accentColor}40;animation:success-pulse 0.6s ease-out 0.3s both;`;
              const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
              svg.setAttribute("width", "28");
              svg.setAttribute("height", "28");
              svg.setAttribute("viewBox", "0 0 24 24");
              svg.setAttribute("fill", "none");
              svg.setAttribute("stroke", accentColor);
              svg.setAttribute("stroke-width", "2.5");
              svg.setAttribute("stroke-linecap", "round");
              svg.setAttribute("stroke-linejoin", "round");
              const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
              polyline.setAttribute("points", "20 6 9 17 4 12");
              polyline.style.cssText = "stroke-dasharray:20;stroke-dashoffset:20;animation:check-draw 0.4s ease-out 0.4s both;";
              svg.appendChild(polyline);
              iconWrap.appendChild(svg);

              const msg = document.createElement("p");
              msg.style.cssText = "font-size:17px;font-weight:700;margin:0;opacity:0;animation:slide-up-fade 0.25s cubic-bezier(0.16,1,0.3,1) 0.5s both;";
              msg.textContent = successMessage; // safe: textContent never parses HTML

              wrapper.appendChild(iconWrap);
              wrapper.appendChild(msg);
              form.appendChild(wrapper);
            } else {
              showError("Something went wrong. Please try again.");
            }
          } catch {
            const resetBtn2 = () => {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent =
                  form
                    .closest('div[data-type="form-block"]')
                    ?.getAttribute("data-submit-label") || "Submit";
              }
            };
            resetBtn2();
            // Remove any previous error
            form.querySelector("[data-form-error]")?.remove();
            const err = document.createElement("p");
            err.setAttribute("data-form-error", "true");
            err.style.cssText =
              "color:#dc2626;font-size:13px;margin-top:8px;text-align:center;";
            err.textContent = "Something went wrong. Please try again.";
            form.appendChild(err);
          }
        },
        { signal: controller.signal }
      );
    });

    return () => {
      controllers.forEach((c) => c.abort());
    };
  }, [pageId, accentColor]);

  return null;
}
