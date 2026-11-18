import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

/**
 * Serializes a copied slice to plain text for `text/plain`. The default ProseMirror
 * serializer joins blocks with bare newlines and drops the list structure, so a copied
 * bullet list loses its markers. This keeps lists as markdown-style list items so the
 * copied text still reads as the list it was.
 */
export function sliceToPlainText(slice: Slice): string {
	return blocksToLines(slice.content).join('\n')
}

function blocksToLines(fragment: Fragment): string[] {
	const lines: string[] = []
	fragment.forEach(node => {
		lines.push(...nodeToLines(node))
	})
	return lines
}

function nodeToLines(node: ProseMirrorNode): string[] {
	switch (node.type.name) {
		case 'bulletList':
			return listToLines(node, () => '- ')
		case 'orderedList': {
			let index = Number(node.attrs.start ?? 1)
			return listToLines(node, () => `${index++}. `)
		}
		case 'taskList':
			return listToLines(node, child => child.attrs.checked ? '- [x] ' : '- [ ] ')
		case 'blockquote':
			return blocksToLines(node.content).map(line => line === '' ? '>' : `> ${line}`)
		default:
			if (node.isTextblock) {
				return [node.textContent]
			}
			if (node.isLeaf) {
				return []
			}
			return blocksToLines(node.content)
	}
}

function listToLines(list: ProseMirrorNode, marker: (item: ProseMirrorNode) => string): string[] {
	const lines: string[] = []
	list.forEach(item => {
		const prefix = marker(item)
		const indent = ' '.repeat(prefix.length)
		const itemLines = blocksToLines(item.content)
		if (itemLines.length === 0) {
			lines.push(prefix.trimEnd())
			return
		}
		itemLines.forEach((line, index) => {
			lines.push(index === 0 ? prefix + line : indent + line)
		})
	})
	return lines
}
