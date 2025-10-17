from playwright.sync_api import Page, expect

def test_redesign_verification(page: Page):
    """
    This test verifies the new futuristic redesign of the application.
    """
    # 1. Navigate to the application.
    page.goto("http://localhost:5000")

    # 2. Input name and submit.
    page.get_by_placeholder("Digite seu nome completo").fill("Jules Verne")
    page.get_by_role("button", name="OK").click()

    # 3. Acknowledge credentials and start the journey.
    page.get_by_role("button", name="Entendi, anotei minhas credenciais").click()
    page.get_by_role("button", name="Vamos Começar!").click()

    # 4. Assert that the main content is visible.
    expect(page.locator("#main-content")).to_be_visible()

    # 5. Take a screenshot of the main page.
    page.screenshot(path="jules-scratch/verification/verification.png")