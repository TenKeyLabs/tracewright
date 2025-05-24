import { Page } from "@playwright/test";
import { GenerateCodeResponse } from "./llm_request";

export type ClickableDomResult = {
  visibleElements: string;
  hiddenElements: string;
};

export const getInteractiveHTML = async (page: Page): Promise<ClickableDomResult> => {
  const elementIndex = 1;
  const domResult = await getClickableElements(page, elementIndex);

  return domResult;
};

export const executeCode = async (page: Page, codeResponse: GenerateCodeResponse) => {
  const asyncFunction = new Function("page", `return (async (page) => { ${codeResponse.code} })(page);`);
  await asyncFunction(page);
};

export const clearElementHighlights = async (page: Page) => {
  await page.evaluate(() => {
    const elements = document.querySelectorAll<HTMLElement>(".dynamic-element-highlight");
    elements.forEach((element) => element.remove());
  });
};

type HighlightSettings = {
  outlineWidth: number;
  labelTextColor: string;
  labelPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  zIndex: number;
};

const highlightSettings: HighlightSettings = {
  outlineWidth: 3,
  labelTextColor: "white",
  labelPosition: "top-left",
  zIndex: 10000,
};

const getClickableElements = async (page: Page, elementIndex: number): Promise<ClickableDomResult> => {
  const clickableElements = await page.evaluate<
    string[],
    { elementIndex: number; highlightSettings: HighlightSettings }
  >(
    async ({ elementIndex, highlightSettings }): Promise<string[]> => {
      function isVisible(element: HTMLElement) {
        const style = window.getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          element.offsetWidth > 0 &&
          element.offsetHeight > 0
        );
      }

      function isTopElement(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        const elementX = rect.left + rect.width / 2;
        const elementY = rect.top + rect.height / 2;

        const topElement = document.elementFromPoint(elementX, elementY);
        return !topElement ? false : topElement === element;
      }

      function getHighlightColorHex(index: number): string {
        const highlightColorsHex: string[] = [
          "#E63946", // Bright red
          "#1D3557", // Deep blue
          "#2A9D8F", // Teal
          "#E9C46A", // Gold
          "#8338EC", // Purple
          "#FF6B35", // Orange
          "#2B9348", // Green
          "#7B2CBF", // Violet
          "#F94144", // Vermilion
          "#073B4C", // Dark blue-green
        ];

        return highlightColorsHex[index % highlightColorsHex.length];
      }

      function highlightElement(element: Element, index: number) {
        // Get position information
        const rect = element.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        // Create highlight container
        const color = getHighlightColorHex(index);
        const highlight = document.createElement("div");
        highlight.className = "dynamic-element-highlight";
        highlight.style.position = "absolute";
        highlight.style.top = `${rect.top + scrollTop}px`;
        highlight.style.left = `${rect.left + scrollLeft}px`;
        highlight.style.width = `${rect.width - highlightSettings.outlineWidth}px`;
        highlight.style.height = `${rect.height - highlightSettings.outlineWidth}px`;
        highlight.style.outline = `${highlightSettings.outlineWidth}px solid ${color}`;
        highlight.style.pointerEvents = "none"; // Allow clicking through
        highlight.style.boxSizing = "border-box";
        highlight.style.zIndex = highlightSettings.zIndex.toString();

        // Create index label
        const label = document.createElement("div");
        label.textContent = String(index); // 1-based indexing for display
        label.style.position = "absolute";
        label.style.backgroundColor = color;
        label.style.color = highlightSettings.labelTextColor;
        label.style.padding = "2px 6px";
        label.style.borderRadius = "3px";
        label.style.fontSize = "12px";
        label.style.fontWeight = "bold";
        label.style.zIndex = (highlightSettings.zIndex + 1).toString();

        // Position the label
        switch (highlightSettings.labelPosition) {
          case "top-left":
            label.style.top = "0";
            label.style.left = "0";
            label.style.transform = "translate(-75%, -75%)";
            break;
          case "top-right":
            label.style.top = "0";
            label.style.right = "0";
            label.style.transform = "translate(75%, -75%)";
            break;
          case "bottom-left":
            label.style.bottom = "0";
            label.style.left = "0";
            label.style.transform = "translate(-75%, 75%)";
            break;
          case "bottom-right":
            label.style.bottom = "0";
            label.style.right = "0";
            label.style.transform = "translate(75%, 75%)";
            break;
          default:
            label.style.top = "0";
            label.style.left = "0";
            label.style.transform = "translate(-75%, -75%)";
        }

        highlight.appendChild(label);
        document.body.appendChild(highlight);
      }

      function elementHtmlWithIndex(element: Element, index: number) {
        return `${index}: ${element.outerHTML}\n`;
      }

      function getAllInputs() {
        const inputs: HTMLElement[] = Array.from(document.querySelectorAll("input"));
        const textareas: HTMLElement[] = Array.from(document.querySelectorAll("textarea"));

        return [...inputs, ...textareas];
      }

      function isClickableElement(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element);
        return element.tagName === "BUTTON" || (style.cursor === "pointer" && element.tagName != "INPUT");
      }

      function containsChildOnTop(element: Element): boolean {
        const children = element.children;

        if (element.children.length == 0) return isTopElement(element);
        for (let i = 0; i < children.length; i++) {
          const child = children[i];

          const isTopElement = containsChildOnTop(child);
          if (isTopElement) return true;
        }

        return false;
      }

      const clickableVisibleElements: string[] = [];
      const clickableHiddenElements: string[] = [];

      // Find all elements with cursor:pointer style
      const allElements = document.querySelectorAll("div, span, a, button, input, textarea");
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i] as HTMLElement;

        let previousElementHtml = clickableVisibleElements[clickableVisibleElements.length - 1];
        if (clickableVisibleElements.length > 0 && previousElementHtml.includes(element.outerHTML)) {
          continue;
        }

        previousElementHtml = clickableHiddenElements[clickableHiddenElements.length - 1];
        if (clickableHiddenElements.length > 0 && previousElementHtml.includes(element.outerHTML)) {
          continue;
        }

        if (isClickableElement(element)) {
          if (isVisible(element) && containsChildOnTop(element)) {
            highlightElement(element, elementIndex);
            clickableVisibleElements.push(elementHtmlWithIndex(element, elementIndex));
            elementIndex++;
          } else {
            clickableHiddenElements.push(element.outerHTML + "\n");
          }
        }
      }

      const inputElements = getAllInputs();
      for (let i = 0; i < inputElements.length; i++) {
        const element = inputElements[i];
        highlightElement(element, elementIndex);

        clickableVisibleElements.push(elementHtmlWithIndex(element, elementIndex));
        elementIndex++;
      }

      return [clickableVisibleElements.join(""), clickableHiddenElements.join("")];
    },
    { elementIndex, highlightSettings }
  );

  return { visibleElements: clickableElements[0], hiddenElements: clickableElements[1] };
};
