from setuptools import setup, find_packages

setup(
    name="aurigraph-sdk",
    version="1.0.0",
    description="Python SDK for Aurigraph V11 blockchain",
    author="Aurigraph Team",
    license="Apache-2.0",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[
        "aiohttp>=3.9.0",
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.1.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "isort>=5.12.0",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    keywords=["aurigraph", "blockchain", "dlt", "sdk", "python"],
)
