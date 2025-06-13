from django.http import HttpResponse


def welcome(request):
    html = """
    <html>
      <head>
        <title>GIVIZ API</title>
        <style>
            body { font-family: sans-serif; text-align: center; padding-top: 100px; }
            a.button {
                display: inline-block; padding: 12px 32px; font-size: 1.2em; color: white;
                background-color: #5561F1; border-radius: 8px; text-decoration: none; margin-top: 30px;
                box-shadow: 0 2px 8px rgba(85, 97, 241, 0.18);
                transition: background 0.2s;
            }
            a.button:hover { background-color: #3840aa; }
        </style>
      </head>
      <body>
        <h1>👋 Welcome to GIVIZ API</h1>
        <p>This is the backend API for GIVIZ, a tool to analyze GitHub repositories with AI.
        <br><br>
        <a class="button" href="/swagger/">📖 API Documentation (Swagger UI)</a>
        </p>
      </body>
    </html>
    """
    return HttpResponse(html)
