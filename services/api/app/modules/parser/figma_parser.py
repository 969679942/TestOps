from collections.abc import Mapping


def extract_figma_nodes(payload: dict) -> list[dict[str, str]]:
    document = payload.get("document", {})
    if not isinstance(document, Mapping):
        return []

    nodes: list[dict[str, str]] = []
    _collect_nodes(document, nodes)
    return nodes


def _collect_nodes(node: Mapping[str, object], nodes: list[dict[str, str]]) -> None:
    node_name = str(node.get("name", "")).strip()
    node_type = str(node.get("type", "")).strip()
    node_id = str(node.get("id", "")).strip()

    if node_name or node_type or node_id:
        nodes.append({"id": node_id, "name": node_name, "type": node_type})

    children = node.get("children", [])
    if not isinstance(children, list):
        return

    for child in children:
        if isinstance(child, Mapping):
            _collect_nodes(child, nodes)
