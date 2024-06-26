fx_version "cerulean"

description "FiveM Minigames by Bulgar Development"
author "kristiyanpts"
version '1.0.0'

lua54 'yes'

games {
  "gta5",
}

ui_page 'web/build/index.html'

client_script "client/**/*"

files {
  'web/build/index.html',
  'web/build/**/*',
}
