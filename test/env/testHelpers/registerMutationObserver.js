import appChangeHistorySnapshotTypes from './appChangeHistorySnapshotTypes.json'

const targetNode = global.document.getElementById('app')

const config = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true
}

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    global.sessionStorage.setItem(appChangeHistorySnapshotTypes.lastDomMutation, JSON.stringify({
      type: mutation.type,
      ...(mutation.type === 'childList' ? {
        affectedElementClassName: mutation.target.getAttribute('class'),
        innerText: mutation.target.innerText.trim()
      } : {}),
      ...(mutation.type === 'characterData' ? {
        affectedText: mutation.target.nodeValue,
        parentElementClassName: mutation.target.parentNode.getAttribute('class')
      } : {})
    }))
  }
})

observer.observe(targetNode, config)
