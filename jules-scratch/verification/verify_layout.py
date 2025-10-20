from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://127.0.0.1:5000/")
        page.wait_for_selector("#name-input")
        page.fill("#name-input", "Jules")
        page.click("#submit-name-btn")

        # Wait for the credentials acknowledgement button and click it
        ack_button_selector = "#ack-credentials-btn"
        page.wait_for_selector(ack_button_selector)
        page.click(ack_button_selector)

        # Wait for the "start journey" button and click it
        start_journey_selector = "#start-journey-btn"
        page.wait_for_selector(start_journey_selector)
        page.click(start_journey_selector)

        # Now the app wrapper should be visible
        page.wait_for_selector("#app-wrapper")

        # Give a little time for the animation to complete
        page.wait_for_timeout(1000)

        page.screenshot(path="jules-scratch/verification/verification.png")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
