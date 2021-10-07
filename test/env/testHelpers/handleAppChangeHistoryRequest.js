global.document.addEventListener('fetchAppChangeHistory', (e) => {
  console.log('$' + global.sessionStorage.getItem(e.detail.snapshotType))
})
