from abc import ABC, abstractmethod


class LanguageModelProvider(ABC):
    @abstractmethod
    def extract_graph(self, text: str) -> str:
        pass
