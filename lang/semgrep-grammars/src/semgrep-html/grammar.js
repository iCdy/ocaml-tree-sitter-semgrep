/*
  semgrep-html

  Extends the standard HTML grammar with Semgrep pattern constructs.

  It now also extend the HTML grammar with XML constructs! See scanner_cc.diff
  for the extension to the scanner to support XML entity names (e.g., <f:bar></f:bar>).
  An alternative would be to switch to https://github.com/unhammer/tree-sitter-xml,
  but its grammar looks very complicated and the code is not maintained.
*/

const base_grammar = require('tree-sitter-html/grammar');

module.exports = grammar(base_grammar, {
  name: 'html',

  conflicts: ($, previous) => previous.concat([
  ]),

  /*
     ellipsis ('...') and metavariables ('$FOO') are actually
     valid HTML syntax in many places, so we don't need that many
     grammar extensions
  */
    rules: {

     fragment: $ => repeat($._toplevel_node),

    // like _node, but without $.text and with new entries
    _toplevel_node: $ => choice(
      $.doctype,
      //nope: $.text,
      $.element,
      $.script_element,
      $.style_element,
      $.erroneous_end_tag,
      //NEW:
      $.toplevel_attribute,
      $.xmldoctype
    ),

    // similar to $.attribute, but with mandatory '='
    toplevel_attribute: $ => seq(
        $.attribute_name,
       '=',
        choice(
          $.attribute_value,
          $.quoted_attribute_value
        )
      ),

    xmldoctype: $ => seq(
      '<?xml',
      repeat($.attribute),
      '?>'
    ),

    //alt: redefine instead _start_tag_name and _end_tag_name?
    start_tag: ($, previous) => choice(
      $.semgrep_start_tag,
      previous
    ),
    end_tag: ($, previous) => choice(
      $.semgrep_end_tag,
      previous
    ),

    semgrep_start_tag: $ => seq(
      '<',
      $.semgrep_metavariable,
      repeat($.attribute),
      '>'
    ),

    semgrep_end_tag: $ => seq(
      '</',
      $.semgrep_metavariable,
      '>'
    ),

    semgrep_metavariable: $ => token(/\$[A-Z_][A-Z_0-9]*/),
  }
});
